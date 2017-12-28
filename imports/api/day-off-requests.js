import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email } from 'meteor/email';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { handleError } from 'meteor/saucecode:rollbar';

import { Locations } from './locations.js';
import { Fellowships } from './fellowships.js';
import { ReminderEmails, scheduleReminder } from './reminder-emails.js';

import {
	APP_NOTIFICATION_EMAIL_ADDRESS,
	ADMIN_EMAIL_ADDRESS,
	DAYS_BEFORE_REQUEST_TO_SEND_REMINDER,
	DAY_OFF_FIELDS,
	DAY_OFF_TYPES,
	RESIDENT_DAY_OFF_TYPES,
	FELLOW_DAY_OFF_TYPES,
	REQUESTOR_TYPES,
	DAY_OFF_TYPE_NAMES,
	USER_ROLES
} from '../constants.js';
import {
	displayDateRange,
	nl2br,
	isFellow,
	isFellowRequest,
	getRequestRequestorType,
	article,
	capitalizeFirstLetter,
	camelCaseToWords
} from '../utils.js';

import map from 'lodash/map';
import moment from 'moment';
import 'twix';

export const DayOffRequests = new Mongo.Collection('dayOffRequests');

if(Meteor.isServer){
	Meteor.publish('dayOffRequests', function(){
		if(!this.userId)
			return;

		const user = Meteor.users.findOne(this.userId);
		const fellow = isFellow(this.connection);

		switch(user.role){
			case USER_ROLES.ADMIN:
				return DayOffRequests.find({
					[DAY_OFF_FIELDS.FELLOWSHIP]: {
						$exists: fellow
					}
				});
			case USER_ROLES.RESIDENCY_COORDINATOR:
				if(!fellow)
					return DayOffRequests.find({
						[DAY_OFF_FIELDS.FELLOWSHIP]: {
							$exists: false
						}
					});
				break;
			case USER_ROLES.FELLOWSHIP_COORDINATOR:
				if(fellow)
					return DayOffRequests.find({
						[DAY_OFF_FIELDS.FELLOWSHIP]: {
							$exists: true
						}
					});
				break;
			default:
				return DayOffRequests.find({
					$and: [
						{
							[DAY_OFF_FIELDS.FELLOWSHIP]: {
								$exists: fellow
							}
						},
						{
							$or: [
								{ usersNotified: user.username },
								{ 'confirmationRequests.confirmer': user.username }
							]
						}
					]
				});
		}
	});

	Meteor.publish('dayOffRequests_byId', function(requestId){
		check(requestId, String);
		return [
			DayOffRequests.find({_id: requestId}),
			ReminderEmails.find({requestId: requestId})
		];
	});
}

if(Meteor.isClient){
	Meteor.subscribe('basicUserData');
	Meteor.subscribe('notifyUserData');
}

Meteor.methods({
	'dayOffRequests.insert'(request){
		if(request.requestReason === '(None)')
			request.requestReason = '';

		const locations = Locations.find({}).fetch();
		const locationAdmins = Meteor.users.find({ role: 'location_admin' }).fetch();

		let schema = {
			dayOffType: {
				type: String,
				label: 'Day off type',
				allowedValues: RESIDENT_DAY_OFF_TYPES
			},
			requestorType: {
				type: String,
				label: 'Requestor type',
				allowedValues: REQUESTOR_TYPES
			},
			requestorName: {
				type: String,
				label: 'Name'
			},
			requestorEmail: {
				type: String,
				label: 'Email',
				regEx: SimpleSchema.RegEx.Email
			},
			requestedDate: {
				type: [Date],
				label: 'Requested date range'
			},
			requestedLocation: {
				type: Object,
				label: 'Location'
			},
			'requestedLocation._id': {
				type: String,
				label: 'Location ID',
				allowedValues: map(locations, '_id')
			},
			'requestedLocation.name': {
				type: String,
				label: 'Location name',
				allowedValues: map(locations, 'name')
			},
			'requestedLocation.number': {
				type: String,
				label: 'Location number',
				allowedValues: map(locations, 'number')
			},
			'requestedLocation.administrator': {
				type: String,
				label: 'Location administrator',
				allowedValues: map(locationAdmins, 'username')
			},
			requestReason: {
				type: String,
				label: 'Reason'
			}
		};

		if(isFellow(this.connection)){
			const fellowships = Fellowships.find().fetch();
			const fellowshipAdmins = Meteor.users.find({ role: 'fellowship_admin' }).fetch();
			let allowedLocationIds = map(locations, '_id');
			allowedLocationIds.push('other');
			allowedLocationIds.push('not-assigned-yet');

			let fellowSchema = {
				dayOffType: {
					type: String,
					label: 'Day off type',
					allowedValues: FELLOW_DAY_OFF_TYPES
				},
				'requestedLocation._id': {
					type: String,
					label: 'Location ID',
					allowedValues: allowedLocationIds
				},
				'requestedLocation.name': {
					type: String,
					label: 'Location name',
					// allowedValues: map(locations, 'name')
				},
				'requestedLocation.number': {
					type: String,
					label: 'Location number',
					allowedValues: map(locations, 'number'),
					optional: true
				},
				'requestedLocation.administrator': {
					type: String,
					label: 'Location administrator',
					allowedValues: map(locationAdmins, 'username'),
					optional: true
				},
				'requestedLocation.fellowship': {
					type: String,
					label: 'Location fellowship ID',
					'allowedValues': map(fellowships, '_id'),
					optional: true
				},
				requestedFellowship: {
					type: Object,
					label: 'Fellowship'
				},
				'requestedFellowship._id': {
					type: String,
					label: 'Fellowship ID',
					allowedValues: map(fellowships, '_id')
				},
				'requestedFellowship.name': {
					type: String,
					label: 'Fellowship name',
					allowedValues: map(fellowships, 'name')
				},
				'requestedFellowship.number': {
					type: String,
					label: 'Fellowship number',
					allowedValues: map(fellowships, 'number')
				},
				'requestedFellowship.administrator': {
					type: String,
					label: 'Fellowship administrator',
					allowedValues: map(fellowshipAdmins, 'username')
				},
				additionalFellowshipInfo: {
					type: Object,
					label: 'Additional fellowship info',
					optional: true
				},
				'additionalFellowshipInfo.alreadyNotified': {
					type: Boolean,
					label: 'Has already notified',
					optional: true
				},
				'additionalFellowshipInfo.notified': {
					type: String,
					label: 'Person notified',
					optional: true
				},
				'additionalFellowshipInfo.presenting': {
					type: Boolean,
					label: 'Presenting in meeting',
					optional: true
				},
				'additionalFellowshipInfo.newOrUpdated': {
					type: String,
					label: 'New or updated vacation request',
					allowedValues: [
						'new',
						'updated'
					],
					optional: true
				},
				'additionalFellowshipInfo.cancelRequest': {
					type: Boolean,
					label: 'Cancel vacation request?',
					optional: true
				}
			};

			Object.assign(schema, fellowSchema);
		}

		new SimpleSchema(schema).validate(request);

		if(request.dayOffType !== DAY_OFF_TYPES.SICK)
			request.status = 'pending';

		if(Meteor.isServer){
			request.ipAddress = this.connection.clientAddress;
			request.requestTime = new Date();
		}

		request._id = DayOffRequests.insert(request);

		if(Meteor.isServer){
			if(request.dayOffType === DAY_OFF_TYPES.SICK)
				sendNotifications(request);
			else
				sendConfirmationRequests(request);
		}
	},
	'dayOffRequests.approveRequest'(requestId, note){
		new SimpleSchema({
			note: {
				type: String,
				label: 'Approval note'
			}
		}).validate({ note: note });

		DayOffRequests.update({
			_id: requestId,
			status: 'pending',
			'confirmationRequests.confirmer': Meteor.user().username
		}, {
			$set: {
				'confirmationRequests.$.status': 'approved',
				'confirmationRequests.$.note': note
			}
		});

		const request = DayOffRequests.findOne(requestId);
		let allApproved = true;
		for(let confirmationRequest of request.confirmationRequests){
			if(confirmationRequest.status !== 'approved')
				allApproved = false;
		}
		if(allApproved){
			DayOffRequests.update({ _id: requestId }, {
				$set: {
					status: 'approved'
				}
			});
			if(Meteor.isServer)
				sendRequestApprovalNotifications(request);
		}
	},
	'dayOffRequests.denyRequest'(requestId, reason){
		new SimpleSchema({
			reason: {
				type: String,
				label: 'Denial reason'
			}
		}).validate({ reason: reason });

		DayOffRequests.update({
			_id: requestId,
			status: 'pending',
			'confirmationRequests.confirmer': Meteor.user().username
		}, {
			$set: {
				status: 'denied',
				'confirmationRequests.$.status': 'denied',
				'confirmationRequests.$.reason': reason
			}
		});

		if(Meteor.isServer){
			const request = DayOffRequests.findOne(requestId);
			sendRequestDenialNotifications(request, reason);
		}
	},
	'dayOffRequests.cancelRequest'(requestId, cancelReason){
		new SimpleSchema({
			cancelReason: {
				type: String,
				label: 'Cancel reason'
			}
		}).validate({ cancelReason: cancelReason });

		DayOffRequests.update({
			_id: requestId
		}, {
			$set: {
				status: 'cancelled',
				cancelReason: cancelReason
			}
		});

		if(Meteor.isServer){
			const request = DayOffRequests.findOne(requestId);
			sendRequestCancellationNotifications(request, cancelReason);
		}
	},
	'dayOffRequests.resendConfirmationRequests'(requestId, resendUsernames){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('dayOffRequests.resendConfirmationRequests.unauthorized');

		const request = DayOffRequests.findOne(requestId);
		let pendingConfirmers = [];
		for(let confirmationRequest of request.confirmationRequests){
			if(confirmationRequest.status === 'pending')
				pendingConfirmers.push(confirmationRequest.confirmer);
		}

		new SimpleSchema({
			resendUsernames: {
				type: [String],
				label: 'Usernames to resend',
				allowedValues: pendingConfirmers
			}
		}).validate({ resendUsernames: resendUsernames });

		let resendUsers = Meteor.users.find({ username: {
			$in: resendUsernames
		}}).fetch();

		if(Meteor.isServer){
			sendConfirmationRequests(request, resendUsers, false, false);
		}
	},
	'dayOffRequests.editApprovalNote'(requestId, note){
		new SimpleSchema({
			note: {
				type: String,
				label: 'Approval note'
			}
		}).validate({ note: note });

		DayOffRequests.update({
			_id: requestId,
			status: 'pending',
			'confirmationRequests.confirmer': Meteor.user().username
		}, {
			$set: {
				'confirmationRequests.$.note': note
			}
		});
	}
});

function getUsersToNotify(request){
	const $or = [
		{
			role: USER_ROLES.LOCATION_ADMIN,
			username: request.requestedLocation.administrator
		}
	];

	switch (getRequestRequestorType(request)) {
		case 'fellow':
			$or.push(
				{
					role: USER_ROLES.FELLOWSHIP_ADMIN,
					username: request.requestedFellowship.administrator
				},
				{ role: USER_ROLES.FELLOWSHIP_COORDINATOR }
			);
			break;
		case 'intern':
			$or.push({ role: USER_ROLES.INTERN_COORDINATOR });
			break;
		case 'resident':
		default:
			$or.push(
				{ role: USER_ROLES.RESIDENCY_COORDINATOR },
				{ role: USER_ROLES.CHIEF }
			);
			break;
	}

	return Meteor.users.find({ $or }).fetch();
}

function sendNotifications(request, users = getUsersToNotify(request), sendRequestorNotification = true){
	const requestUrl = Meteor.absoluteUrl('request/' + request._id);
	let locationAdmin;
	if(isFellowRequest(request) && !request.requestedLocation.administrator)
		locationAdmin = {
			name: ''
		};
	else
		locationAdmin = Accounts.findUserByUsername(request.requestedLocation.administrator);

	let reasonHtml = '';
	if(request.requestReason){
		reasonHtml = `
			<blockquote>
				<p>${nl2br(request.requestReason)}</p>
			</blockquote>`;
	}

	let timeout = 0; // FIXME
	for(let user of users){
		try {
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => { // FIXME
				Email.send({
					to: user.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: 'Sick day notification',
					html: `
						<html>
							<head>
								<style>
									th, td {
										padding: 2px 10px;
									}

									table thead tr th {
										text-align: left;
									}
								</style>
							</head>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>${request.requestorName} has taken a sick day.</p>

								<table>
									<thead>
										<tr>
											<th>Name</th>
											<th>Date</th>
											<th>Location</th>
											<th>Location administrator</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>${request.requestorName}</td>
											<td>${displayDateRange(request.requestedDate)}</td>
											<td>${request.requestedLocation.name}</td>
											<td>${locationAdmin.name}</td>
										</tr>
									</tbody>
								</table>

								${reasonHtml}

								<p><a href="${requestUrl}">View details</a></p>

								<p>If you have any questions or concerns about the system please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
			DayOffRequests.update(request, {
				$addToSet: {
					usersNotified: user.username
				}
			});
		}
		catch(e){
			console.log('Error sending notification: ' + e);
			handleError(e);
		}
	}

	if(sendRequestorNotification){
		try{
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: request.requestorEmail,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: 'Sick Day Confirmation',
					html: `
						<html>
							<head>
								<style>
									th, td {
										padding: 2px 10px;
									}

									table thead tr th {
										text-align: left;
									}
								</style>
							</head>
							<body>
								<h1>Hello ${request.requestorName}</h1>

								<p>This email is confirming that you have successfully notified us of your sick day on ${displayDateRange(request.requestedDate)}.</p>

								<table>
									<thead>
										<tr>
											<th>ID</th>
											<th>Date</th>
											<th>Location</th>
											<th>Location administrator</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td><a href="${requestUrl}">${request._id}</a></td>
											<td>${displayDateRange(request.requestedDate)}</td>
											<td>${request.requestedLocation.name}</td>
											<td>${locationAdmin.name}</td>
										</tr>
									</tbody>
								</table>

								${reasonHtml}

								<p>If you have any questions or concerns about the system please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
		}
		catch(e){
			console.log('Error sending notification: ' + e);
			handleError(e);
		}
	}
}

function getUsersForConfirmation(request){
	switch (getRequestRequestorType(request)) {
		case 'fellow':
			return [
				Accounts.findUserByUsername(
					request.requestedFellowship.administrator
				)
			];
		case 'intern':
			return Meteor.users.find({
				role: USER_ROLES.INTERN_COORDINATOR
			}).fetch();
		case 'resident':
		default:
			return Meteor.users.find({
				role: USER_ROLES.CHIEF
			}).fetch();
	}
}

function sendConfirmationRequests(request, users = getUsersForConfirmation(request), sendRequestorNotification = true, sendLocationAdminNotification = true){
	const requestUrl = Meteor.absoluteUrl('request/' + request._id);
	let locationAdmin;
	if(isFellowRequest(request) && !request.requestedLocation.administrator){
		locationAdmin = {
			name: ''
		};
		sendLocationAdminNotification = false;
	}
	else {
		locationAdmin = Accounts.findUserByUsername(request.requestedLocation.administrator);
	}

	let reasonHtml = '';
	if(request.requestReason){
		reasonHtml = `
			<blockquote>
				<p>${nl2br(request.requestReason)}</p>
			</blockquote>`;
	}
	let additionalInfoHtml = '';
	if(request.additionalFellowshipInfo){
		additionalInfoHtml = `
			<table class="table">
				<tbody>`;

		for(let key of Object.keys(request.additionalFellowshipInfo)){
			let value = request.additionalFellowshipInfo[key];
			if(typeof value === 'boolean')
				value = value ? 'yes' : 'no';
			additionalInfoHtml += `
					<tr>
						<th>${camelCaseToWords(key)}</th>
						<td>${capitalizeFirstLetter(value)}</td>
					</tr>`;
		}

		additionalInfoHtml +=
				`</tbody>
			</table>`;
	}

	let typeName = DAY_OFF_TYPE_NAMES[request[DAY_OFF_FIELDS.TYPE]];
	let typeArticle = article(typeName);
	let timeout = 0; // FIXME
	for(let user of users){
		try {
			let confirmationRequest = {};
			timeout += 1000; // FIXME
			confirmationRequest.confirmer = user.username;
			confirmationRequest.status = 'pending';
			Meteor.setTimeout(() => { // FIXME
				Email.send({
					to: user.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: 'Confirmation required',
					html: `
						<html>
							<head>
								<style>
									th, td {
										padding: 2px 10px;
									}

									table thead tr th {
										text-align: left;
									}
								</style>
							</head>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>${request.requestorName} made ${typeArticle} ${typeName} request for ${displayDateRange(request.requestedDate)}.</p>

								<p>
									Please navigate to <a href="${requestUrl}">${requestUrl}</a> or the
									<a href="${Meteor.absoluteUrl('list')}">requests list page</a> to approve or deny this request.
								</p>

								<table>
									<thead>
										<tr>
											<th>Type</th>
											<th>Name</th>
											<th>Date</th>
											<th>Location</th>
											<th>Location administrator</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>${typeName}</td>
											<td>${request.requestorName}</td>
											<td>${displayDateRange(request.requestedDate)}</td>
											<td>${request.requestedLocation.name}</td>
											<td>${locationAdmin.name}</td>
										</tr>
									</tbody>
								</table>

								${reasonHtml}

								${additionalInfoHtml}

								<p>You will be notified when the request is approved or denied.</p>

								<p>If you have any questions or concerns about the system please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
			DayOffRequests.update(request, {
				$addToSet: {
					confirmationRequests: confirmationRequest
				}
			});
		}
		catch(e){
			console.log('Error sending confirmation: ' + e);
			handleError(e);
		}
	}

	if(sendLocationAdminNotification){
		timeout += 1000; // FIXME
		let confirmerList = '<ul>';
		for(let confirmer of users){
			confirmerList += `<li>${confirmer.name} &lt;${confirmer.emails[0].address}&gt;</li>`;
		}
		confirmerList += '</ul>';

		try{
			Meteor.setTimeout(() => { // FIXME
				Email.send({
					to: locationAdmin.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: `${typeName} requested`,
					html: `
						<html>
							<head>
								<style>
									th, td {
										padding: 2px 10px;
									}

									table thead tr th {
										text-align: left;
									}
								</style>
							</head>
							<body>
								<h1>Hello ${locationAdmin.name}</h1>

								<p>${request.requestorName} made ${typeArticle} ${typeName} request for ${displayDateRange(request.requestedDate)}.</p>

								<p>Please navigate to <a href="${requestUrl}">${requestUrl}</a> or the <a href="${Meteor.absoluteUrl('list')}">requests list page</a> to view this request.</p>

								<table>
									<thead>
										<tr>
											<th>Type</th>
											<th>Name</th>
											<th>Date</th>
											<th>Location</th>
											<th>Location administrator</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>${typeName}</td>
											<td>${request.requestorName}</td>
											<td>${displayDateRange(request.requestedDate)}</td>
											<td>${request.requestedLocation.name}</td>
											<td>${locationAdmin.name}</td>
										</tr>
									</tbody>
								</table>

								${reasonHtml}

								<p>
									If you have a problem with this request, please let one of the approvers know:
								</p>

								${confirmerList}

								<p>You will be notified when the request is approved or denied.</p>

								<p>If you have any questions or concerns about the system please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
			DayOffRequests.update(request, {
				$addToSet: {
					usersNotified: locationAdmin.username
				}
			});
		} catch(e){
			console.log('Error sending request notification to location admin: ' + e);
			handleError(e);
		}
	}

	if(sendRequestorNotification){
		let approvers = 'the chiefs';
		if(isFellowRequest(request)){
			if(users && users[0] && users[0].name)
				approvers = users[0].name;
			else
				approvers = 'the fellowship director';
		}

		try{
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: request.requestorEmail,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: 'Request Confirmation',
					html: `
						<html>
							<head>
								<style>
									th, td {
										padding: 2px 10px;
									}

									table thead tr th {
										text-align: left;
									}
								</style>
							</head>
							<body>
								<h1>Hello ${request.requestorName}</h1>

								<p>This email is confirming that you have sent a day off request.</p>

								<table>
									<thead>
										<tr>
											<th>ID</th>
											<th>Name</th>
											<th>Date</th>
											<th>Location</th>
											<th>Location administrator</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td><a href="${requestUrl}">${request._id}</a></td>
											<td>${request.requestorName}</td>
											<td>${displayDateRange(request.requestedDate)}</td>
											<td>${request.requestedLocation.name}</td>
											<td>${locationAdmin.name}</td>
										</tr>
									</tbody>
								</table>

								${reasonHtml}

								<p>Confirmation has been requested by ${approvers}. You will be notified of their response.</p>

								<p>To view or cancel this request, please visit <a href="${requestUrl}">${requestUrl}</a>.</p>

								<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
		}
		catch(e){
			console.log('Error sending notification: ' + e);
			handleError(e);
		}
	}
}

function sendRequestApprovalNotifications(request){
	const users = getUsersToNotify(request);
	const requestUrl = Meteor.absoluteUrl('request/' + request._id);
	let typeName = DAY_OFF_TYPE_NAMES[request[DAY_OFF_FIELDS.TYPE]];
	let timeout = 0; // FIXME
	for(let user of users){
		try {
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: user.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: `${typeName} Request Approved`,
					html: `
						<html>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>
									This email is notifying you that <a href="${requestUrl}">
									${request.requestorName}'s ${typeName} request for ${displayDateRange(request.requestedDate)}</a>
									has been approved.
								</p>

								<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);

			if(user.role === 'location_admin'){
				let remindTime = moment(request.requestedDate[0]).subtract(DAYS_BEFORE_REQUEST_TO_SEND_REMINDER, 'days').startOf('day');
				if(moment() < moment(remindTime).subtract(1, 'day'))
					scheduleReminder(request, user, remindTime.toDate());
			}
		}
		catch(e){
			console.log('Error sending approval notification: ' + e);
			handleError(e);
		}
	}

	try{
		timeout += 1000; // FIXME
		Meteor.setTimeout(() => {
			Email.send({
				to: request.requestorEmail,
				from: APP_NOTIFICATION_EMAIL_ADDRESS,
				subject: 'Request Approved!',
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>Your <a href="${requestUrl}">${typeName} request</a> for ${displayDateRange(request.requestedDate)} has been approved!</p>

							<p>Be sure to remind your site location administrator 1-2 days prior to your absence.</p>

							<p>If you would like to cancel this ${typeName}, you can do so by visiting the <a href="${requestUrl}">request page</a>.</p>

							<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

							<p>Thank you!</p>
						</body>
					</html>`
			});
		}, timeout);
	}
	catch(e){
		console.log('Error sending approval notification: ' + e);
		handleError(e);
	}
}

function sendRequestDenialNotifications(request, reason){
	const users = getUsersToNotify(request);
	const requestUrl = Meteor.absoluteUrl('request/' + request._id);
	let typeName = DAY_OFF_TYPE_NAMES[request[DAY_OFF_FIELDS.TYPE]];
	let timeout = 0; // FIXME
	for(let user of users){
		try{
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: user.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: `${typeName} Request Denied`,
					html: `
						<html>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>
									This email is notifying you that <a href="${requestUrl}">
									${request.requestorName}'s ${typeName} request for ${displayDateRange(request.requestedDate)}</a>
									has been denied by ${Meteor.user.name} for the following reason.
								</p>

								<blockquote>
									<p>${nl2br(reason)}</p>
								</blockquote>

								<p>${request.requestorName} will be notified of its denial.</p>

								<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
		}
		catch(e){
			console.log('Error sending denial notification: ' + e);
			handleError(e);
		}
	}

	try{
		timeout += 1000; // FIXME
		Meteor.setTimeout(() => {
			Email.send({
				to: request.requestorEmail,
				from: APP_NOTIFICATION_EMAIL_ADDRESS,
				subject: `${typeName} Request Denied`,
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>
								This email is notifying you that your <a href="${requestUrl}">${typeName}</a>
								request for ${displayDateRange(request.requestedDate)}
								has been denied by ${Meteor.user.name} for the following reason.
							</p>

							<blockquote>
								<p>${nl2br(reason)}</p>
							</blockquote>

							<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

							<p>Thank you!</p>
						</body>
					</html>`
			});
		}, timeout);
	}
	catch(e){
		console.log('Error sending denial notification: ' + e);
		handleError(e);
	}
}

function sendRequestCancellationNotifications(request, cancelReason){
	const users = getUsersToNotify(request);
	const requestUrl = Meteor.absoluteUrl('request/' + request._id);
	let typeName = DAY_OFF_TYPE_NAMES[request[DAY_OFF_FIELDS.TYPE]];
	let timeout = 0; // FIXME
	for(let user of users){
		try{
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: user.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: `${typeName} Request Cancelled`,
					html: `
						<html>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>
									This email is notifying you that <a href="${requestUrl}">
									${request.requestorName}'s ${typeName} request for ${displayDateRange(request.requestedDate)}</a>
									has been cancelled for the following reason.
								</p>

								<blockquote>
									<p>${nl2br(cancelReason)}</p>
								</blockquote>

								<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
		}
		catch(e){
			console.log('Error sending cancellation notification: ' + e);
			handleError(e);
		}
	}

	try{
		timeout += 1000; // FIXME
		Meteor.setTimeout(() => {
			Email.send({
				to: request.requestorEmail,
				from: APP_NOTIFICATION_EMAIL_ADDRESS,
				subject: `${typeName} Request Cancelled`,
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>
								This email is notifying you that your <a href="${requestUrl}">${typeName} request</a>
								for ${displayDateRange(request.requestedDate)}
								has been cancelled for the following reason.
							</p>

							<blockquote>
								<p>${nl2br(cancelReason)}</p>
							</blockquote>

							<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

							<p>Thank you!</p>
						</body>
					</html>`
			});
		}, timeout);
	}
	catch(e){
		console.log('Error sending cancellation confirmation: ' + e);
		handleError(e);
	}
}
