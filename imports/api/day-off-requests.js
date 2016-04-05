import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email } from 'meteor/email';
import { Random } from 'meteor/random';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Locations } from './locations.js';

import { APP_EMAIL_ADDRESS, APP_URL } from '../constants.js';

import moment from 'moment';
import map from 'lodash/map';

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
					{ notified: user.username },
					{ "confirmationRequests.confirmer": user.username }
				]
			});
		}
	});
}

if(Meteor.isClient){
	Meteor.subscribe('allUserData'); // FIXME?
}

Meteor.methods({
	'dayOffRequests.insert'(request){
		const locations = Locations.find({}).fetch();
		const locationAdmins = Meteor.users.find({ role: "location_admin" }).fetch();

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
			requestedDate: {
				type: Date,
				label: "Requested date",
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
			sendRequestApprovalNotifications();
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
		sendRequestDenialNotifications();
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
	let timeout = 0; // FIXME
	for(let user of users){
		try {
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => { // FIXME
				Email.send({ // TODO: Split into function?
					to: user.emails[0].address,
					from: APP_EMAIL_ADDRESS,
					subject: "Notification!",
					text: `Name: ${request.requestorName}\nType: ${request.dayOffType}\nDate: ${request.requestedDate}\nLocation: ${request.requestedLocation.name}`
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
		}
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
	let timeout = 0; // FIXME
	for(let user of users){
		try {
			let confirmationRequest = {}; // TODO: Rename to approvalRequest?
			timeout += 1000; // FIXME
			confirmationRequest.confirmer = user.username;
			confirmationRequest.status = "pending";
			Meteor.setTimeout(() => { // FIXME
				Email.send({ // TODO: Split into function?
					to: user.emails[0].address,
					from: APP_EMAIL_ADDRESS,
					subject: "Confirmation required",
					text: `Please click here to respond to the confirmation request: ${APP_URL}/request/${request._id}` // FIXME
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
		}
	}
}

function sendRequestApprovalNotifications(){
	// TODO
}

function sendRequestDenialNotifications(){
	// TODO
}
