import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email } from 'meteor/email';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Locations } from './locations.js';

import { APP_NOTIFICATION_EMAIL_ADDRESS, ADMIN_EMAIL_ADDRESS } from '../constants.js';

import { alertAdministrator, displayDateRange, nl2br } from '../utils.js';

import map from 'lodash/map';
import moment from 'moment';
import 'twix';

export const DayOffRequests = new Mongo.Collection('dayOffRequests');

if(Meteor.isServer){
	Meteor.publish('dayOffRequests', function(){
		if(!this.userId)
			return;
		const user = Meteor.users.findOne(this.userId);
		if(user.role === "admin"){
			return DayOffRequests.find({});
		}
		else{
			return DayOffRequests.find({
				$or: [
					{ usersNotified: user.username },
					{ "confirmationRequests.confirmer": user.username }
				]
			});
		}
	});
}

if(Meteor.isClient){
	Meteor.subscribe('basicUserData');
	Meteor.subscribe('notifyUserData');
}

Meteor.methods({
	'dayOffRequests.insert'(request){
		const locations = Locations.find({}).fetch();
		const locationAdmins = Meteor.users.find({ role: "location_admin" }).fetch();

		if(request.requestReason == "(None)")
			request.requestReason = "";

		new SimpleSchema({
			dayOffType: {
				type: String,
				label: "Day off type",
				allowedValues: [
					"sick",
					"iDay"
				]
			},
			requestorName: {
				type: String,
				label: "Name"
			},
			requestorEmail: {
				type: String,
				label: "Email",
				regEx: SimpleSchema.RegEx.Email
			},
			requestedDate: {
				type: [Date],
				label: "Requested date range",
				min: moment().startOf("day").toDate()
			},
			requestedLocation: {
				type: Object,
				label: "Location"
			},
			"requestedLocation._id": {
				type: String,
				label: "Location ID",
				allowedValues: map(locations, "_id")
			},
			"requestedLocation.name": {
				type: String,
				label: "Location name",
				allowedValues: map(locations, "name")
			},
			"requestedLocation.number": {
				type: String,
				label: "Location number",
				allowedValues: map(locations, "number")
			},
			"requestedLocation.administrator": {
				type: String,
				label: "Location administrator",
				allowedValues: map(locationAdmins, "username")
			},
			requestReason: {
				type: String,
				label: "Reason"
			}
		}).validate(request);

		if(request.dayOffType == "iDay")
			request.status = "pending";

		if(Meteor.isServer){
			request.ipAddress = this.connection.clientAddress;
			request.requestTime = new Date();
		}

		request._id = DayOffRequests.insert(request);

		if(Meteor.isServer){
			switch(request.dayOffType){
				case "sick":
					sendNotifications(request);
					break;
				case "iDay":
					sendConfirmationRequests(request);
					break;
			}
		}
	},
	'dayOffRequests.approveRequest'(requestId, note){
		new SimpleSchema({
			note: {
				type: String,
				label: "Approval note"
			}
		}).validate({ note: note });

		DayOffRequests.update({
			_id: requestId,
			dayOffType: "iDay",
			status: "pending",
			"confirmationRequests.confirmer": Meteor.user().username
		}, {
			$set: {
				"confirmationRequests.$.status": "approved",
				"confirmationRequests.$.note": note
			}
		});

		const request = DayOffRequests.findOne(requestId);
		let allApproved = true;
		for(let confirmationRequest of request.confirmationRequests){
			if(confirmationRequest.status !== "approved")
				allApproved = false;
		}
		if(allApproved){
			DayOffRequests.update({ _id: requestId }, {
				$set: {
					status: "approved"
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
				label: "Denial reason"
			}
		}).validate({ reason: reason });

		DayOffRequests.update({
			_id: requestId,
			dayOffType: "iDay",
			status: "pending",
			"confirmationRequests.confirmer": Meteor.user().username
		}, {
			$set: {
				status: "denied",
				"confirmationRequests.$.status": "denied",
				"confirmationRequests.$.reason": reason
			}
		});

		if(Meteor.isServer){
			const request = DayOffRequests.findOne(requestId);
			sendRequestDenialNotifications(request, reason);
		}
	},
	'dayOffRequests.resendConfirmationRequests'(requestId, resendUsernames){
		if(Meteor.user().role !== "admin")
			throw new Meteor.Error("dayOffRequests.resendConfirmationRequests.unauthorized");

		const request = DayOffRequests.findOne(requestId);
		let pendingConfirmers = [];
		for(let confirmationRequest of request.confirmationRequests){
			if(confirmationRequest.status === "pending")
				pendingConfirmers.push(confirmationRequest.confirmer);
		}

		new SimpleSchema({
			resendUsernames: {
				type: [String],
				label: "Usernames to resend",
				allowedValues: pendingConfirmers
			}
		}).validate({ resendUsernames: resendUsernames });

		let resendUsers = Meteor.users.find({ username: {
			$in: resendUsernames
		}}).fetch();

		if(Meteor.isServer){
			sendConfirmationRequests(request, resendUsers, false);
		}
	},
	'dayOffRequests.editApprovalNote'(requestId, note){
		new SimpleSchema({
			note: {
				type: String,
				label: "Approval note"
			}
		}).validate({ note: note });

		DayOffRequests.update({
			_id: requestId,
			dayOffType: "iDay",
			status: "pending",
			"confirmationRequests.confirmer": Meteor.user().username
		}, {
			$set: {
				"confirmationRequests.$.note": note
			}
		});
	}
});

function getUsersToNotify(request){
	return Meteor.users.find({
		$or: [
			{ notify: true },
			{ role: "chief" },
			{ role: "location_admin", username: request.requestedLocation.administrator }
		]
	}).fetch();
}

function sendNotifications(request, users, sendRequestorNotification = true){
	users = typeof users !== "undefined" ? users : getUsersToNotify(request);
	const requestUrl = Meteor.absoluteUrl("request/" + request._id);
	let errors = false;
	const locationAdmin = Accounts.findUserByUsername(request.requestedLocation.administrator);

	let reasonHtml = "";
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
					subject: "Sick day notification",
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
			console.log("Error sending notification: " + e);
			errors = true;
		}
	}

	if(sendRequestorNotification){
		try{
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: request.requestorEmail,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: "Sick Day Confirmation",
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
											<th>Date</th>
											<th>Location</th>
											<th>Location administrator</th>
										</tr>
									</thead>
									<tbody>
										<tr>
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
			console.log("Error sending notification: " + e);
			errors = true;
		}
	}

	if(errors){
		alertAdministrator();
	}
}

function getUsersForConfirmation(request){
	return Meteor.users.find({
		$or: [
			{ role: "chief" },
			{ role: "location_admin", username: request.requestedLocation.administrator }
		]
	}).fetch();
}

function sendConfirmationRequests(request, users, sendRequestorNotification = true){
	users = typeof users !== "undefined" ? users : getUsersForConfirmation(request);
	const requestUrl = Meteor.absoluteUrl("request/" + request._id);
	const locationAdmin = Accounts.findUserByUsername(request.requestedLocation.administrator);
	let errors = false;

	let reasonHtml = "";
	if(request.requestReason){
		reasonHtml = `
			<blockquote>
				<p>${nl2br(request.requestReason)}</p>
			</blockquote>`;
	}

	let timeout = 0; // FIXME
	for(let user of users){
		try {
			let confirmationRequest = {};
			timeout += 1000; // FIXME
			confirmationRequest.confirmer = user.username;
			confirmationRequest.status = "pending";
			Meteor.setTimeout(() => { // FIXME
				Email.send({
					to: user.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: "Confirmation required",
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

								<p>${request.requestorName} has requested an I-Day for ${displayDateRange(request.requestedDate)}.</p>

								<p>Please navigate to <a href="${requestUrl}">${requestUrl}</a> or the <a href="${Meteor.absoluteUrl("list")}">requests list page</a> to approve or deny this request.</p>

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
			console.log("Error sending confirmation: " + e);
			errors = true;
		}
	}

	if(sendRequestorNotification){
		try{
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: request.requestorEmail,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: "Request Confirmation",
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

								<p>Confirmation has been requested by the chiefs and the location site administrator. You will be notified of their response.</p>

								<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
		}
		catch(e){
			console.log("Error sending notification: " + e);
			errors = true;
		}
	}

	if(errors){
		alertAdministrator();
	}
}

function sendRequestApprovalNotifications(request){
	const users = getUsersToNotify(request);
	const requestUrl = Meteor.absoluteUrl("request/" + request._id);
	let errors = false;
	let timeout = 0; // FIXME
	for(let user of users){
		try {
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: user.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: "I-Day Request Approved",
					html: `
						<html>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>
									This email is notifying you that <a href="${requestUrl}">
									${request.requestorName}'s I-Day request for ${displayDateRange(request.requestedDate)}</a>
									has been approved.
								</p>

								<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
		}
		catch(e){
			console.log("Error sending approval notification: " + e);
			errors = true;
		}
	}

	try{
		timeout += 1000; // FIXME
		Meteor.setTimeout(() => {
			Email.send({
				to: request.requestorEmail,
				from: APP_NOTIFICATION_EMAIL_ADDRESS,
				subject: "Request Approved!",
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>Your I-Day request for ${displayDateRange(request.requestedDate)} has been approved!</p>

							<p>Be sure to remind your site location administrator 1-2 days prior to your absence.</p>

							<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

							<p>Thank you!</p>
						</body>
					</html>`
			});
		}, timeout);
	}
	catch(e){
		console.log("Error sending approval notification: " + e);
		errors = true;
	}

	if(errors){
		alertAdministrator();
	}
}

function sendRequestDenialNotifications(request, reason){
	const users = getUsersToNotify(request);
	const requestUrl = Meteor.absoluteUrl("request/" + request._id);
	let errors = false;
	let timeout = 0; // FIXME
	for(let user of users){
		try{
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send({
					to: user.emails[0].address,
					from: APP_NOTIFICATION_EMAIL_ADDRESS,
					subject: "I-Day Request Denied",
					html: `
						<html>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>
									This email is notifying you that <a href="${requestUrl}">
									${request.requestorName}'s I-Day request for ${displayDateRange(request.requestedDate)}</a>
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
			console.log("Error sending denial notification: " + e);
			errors = true;
		}
	}

	try{
		timeout += 1000; // FIXME
		Meteor.setTimeout(() => {
			Email.send({
				to: request.requestorEmail,
				from: APP_NOTIFICATION_EMAIL_ADDRESS,
				subject: "I-Day Request Denied",
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>
								This email is notifying you that your I-Day request for ${displayDateRange(request.requestedDate)}
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
		console.log("Error sending denial notification: " + e);
		errors = true;
	}

	if(errors){
		alertAdministrator();
	}
}
