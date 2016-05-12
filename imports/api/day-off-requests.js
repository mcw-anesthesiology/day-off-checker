import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email } from 'meteor/email';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Locations } from './locations.js';

import { APP_EMAIL_ADDRESS } from '../constants.js';

import { alertAdministrator } from '../utils.js';

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
	Meteor.subscribe('allUserData'); // FIXME ?
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
				min: moment().utc().startOf("day").toDate()
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
	'dayOffRequests.approveRequest'(requestId){ // FIXME: Way more validation
		DayOffRequests.update({
			_id: requestId,
			dayOffType: "iDay",
			status: "pending",
			"confirmationRequests.confirmer": Meteor.user().username
		}, {
			$set: {
				"confirmationRequests.$.status": "approved"
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
	'dayOffRequests.denyRequest'(requestId, reason){ // FIXME: Way more validation
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

function sendNotifications(request){
	const users = getUsersToNotify(request);
	const requestUrl = Meteor.absoluteUrl("request/" + request._id);
	let errors = false;
	const locationAdmin = Accounts.findUserByUsername(request.requestedLocation.administrator);
	let timeout = 0; // FIXME
	for(let user of users){
		try {
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => { // FIXME
				Email.send({
					to: user.emails[0].address,
					from: APP_EMAIL_ADDRESS,
					subject: "Sick day notification",
					html: `
						<html>
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
											<td>${moment(request.requestedDate[0]).twix(request.requestedDate[1], true).format()}</td>
											<td>${request.requestedLocation.name}</td>
											<td>${locationAdmin.name}</td>
										</tr>
									</tbody>
								</table>

								<p><a href="${requestUrl}">View details</a></p>

								<p>If you have any questions or concerns about the system please contact me at <a href="mailto:jmischka@mcw.edu">jmischka@mcw.edu</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
			DayOffRequests.update(request, {
				$push: {
					usersNotified: user.username
				}
			});
		}
		catch(e){
			console.log("Error sending notification: " + e);
			errors = true;
		}
	}

	try{
		timeout += 1000; // FIXME
		Meteor.setTimeout(() => {
			Email.send({
				to: request.requestorEmail,
				from: APP_EMAIL_ADDRESS,
				subject: "Sick Day Confirmation",
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>This email is confirming that you have successfully notified us of your sick day on ${moment(request.requestedDate[0]).twix(request.requestedDate[1], true).format()}.</p>

							<p>If you have any questions or concerns about the system please contact me at <a href="mailto:jmischka@mcw.edu">jmischka@mcw.edu</a>.</p>

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

function sendConfirmationRequests(request){
	const users = getUsersForConfirmation(request);
	const requestUrl = Meteor.absoluteUrl("request/" + request._id);
	let errors = false;
	let timeout = 0; // FIXME
	for(let user of users){
		try {
			let confirmationRequest = {}; // TODO: Rename to approvalRequest?
			timeout += 1000; // FIXME
			confirmationRequest.confirmer = user.username;
			confirmationRequest.status = "pending";
			Meteor.setTimeout(() => { // FIXME
				Email.send({
					to: user.emails[0].address,
					from: APP_EMAIL_ADDRESS,
					subject: "Confirmation required",
					html: `
						<html>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>${request.requestorName} has requested an I-Day for ${moment(request.requestedDate[0]).twix(request.requestedDate[1], true).format()}.</p>

								<p>Please navigate to <a href="${requestUrl}">${requestUrl}</a> to approve or deny this request.</p>

								<p>You will be notified when the request is approved or denied.</p>

								<p>If you have any questions or concerns about the system please contact me at <a href="mailto:jmischka@mcw.edu">jmischka@mcw.edu</a>.</p>

								<p>Thank you!</p>
							</body>
						</html>`
				});
			}, timeout);
			DayOffRequests.update(request, {
				$push: {
					confirmationRequests: confirmationRequest
				}
			});
		}
		catch(e){
			console.log("Error sending confirmation: " + e);
			errors = true;
		}
	}

	try{
		timeout += 1000; // FIXME
		Meteor.setTimeout(() => {
			Email.send({
				to: request.requestorEmail,
				from: APP_EMAIL_ADDRESS,
				subject: "Request Confirmation",
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>This email is confirming that you have sent a day off request.</p>

							<p>Confirmation has been requested by the chiefs and the location site administrator. You will be notified of their response.</p>

							<p>If you have any questions or concerns please contact me at <a href="mailto:jmischka@mcw.edu">jmischka@mcw.edu</a>.</p>

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
					from: APP_EMAIL_ADDRESS,
					subject: "I-Day Request Approved",
					html: `
						<html>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>
									This email is notifying you that <a href="${requestUrl}">
									${request.requestorName}'s I-Day request for ${moment(request.requestedDate[0]).twix(request.requestedDate[1], true).format()}</a>
									has been approved.
								</p>

								<p>If you have any questions or concerns please contact me at <a href="mailto:jmischka@mcw.edu">jmischka@mcw.edu</a>.</p>

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
				from: APP_EMAIL_ADDRESS,
				subject: "Request Approved!",
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>Your I-Day request for ${moment(request.requestedDate[0]).twix(request.requestedDate[1], true).format()} has been approved!</p>

							<p>If you have any questions or concerns please contact me at <a href="mailto:jmischka@mcw.edu">jmischka@mcw.edu</a>.</p>

							<p>Thank you!</p>
						</body>
					</html>` // TODO: Tell them anything else important?
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
					from: APP_EMAIL_ADDRESS,
					subject: "I-Day Request Denied",
					html: `
						<html>
							<body>
								<h1>Hello ${user.name}</h1>

								<p>
									This email is notifying you that <a href="${requestUrl}">
									${request.requestorName}'s I-Day request for ${moment(request.requestedDate[0]).twix(request.requestedDate[1], true).format()}</a>
									has been denied by ${Meteor.user.name} for the following reason.
								</p>

								<blockquote>
									<p>${reason.replace(/(?:\r\n|\r|\n)/g, '<br />')}</p>
								</blockquote>

								<p>${request.requestorName} will be notified of its denial.</p>

								<p>If you have any questions or concerns please contact me at <a href="mailto:jmischka@mcw.edu">jmischka@mcw.edu</a>.</p>

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
				from: APP_EMAIL_ADDRESS,
				subject: "I-Day Request Denied",
				html: `
					<html>
						<body>
							<h1>Hello ${request.requestorName}</h1>

							<p>
								This email is notifying you that your I-Day request for ${moment(request.requestedDate[0]).twix(request.requestedDate[1], true).format()}
								has been denied by ${Meteor.user.name} for the following reason.
							</p>

							<blockquote>
								<p>${reason.replace(/(?:\r\n|\r|\n)/g, '<br />')}</p>
							</blockquote>

							<p>If you have any questions or concerns please contact me at <a href="mailto:jmischka@mcw.edu">jmischka@mcw.edu</a>.</p>

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
