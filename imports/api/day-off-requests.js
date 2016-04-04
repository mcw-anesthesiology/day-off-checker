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
		return DayOffRequests.find({}); // FIXME
	});
}

if(Meteor.isClient){
	Meteor.subscribe('allUserData');
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

		if(Meteor.isServer){
			request.ipAddress = this.connection.clientAddress;
			request.requestTime = new Date();
		}

		DayOffRequests.insert(request);

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
			let confirmationRequest = {};
			timeout += 1000; // FIXME
			confirmationRequest.token = Random.id();
			confirmationRequest.confirmer = user.username;
			confirmationRequest.status = "pending";
			Meteor.setTimeout(() => { // FIXME
				Email.send({ // TODO: Split into function?
					to: user.emails[0].address,
					from: APP_EMAIL_ADDRESS,
					subject: "Confirmation required",
					text: `Please click here to respond to the confirmation request: ${APP_URL}/confirmation/${confirmationRequest.confirmationUrl}`
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
