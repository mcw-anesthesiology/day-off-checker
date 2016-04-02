import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email } from 'meteor/email';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Locations } from './locations.js';

import moment from 'moment';
import map from 'lodash/map';

export const DayOffRequests = new Mongo.Collection('dayOffRequests');

if(Meteor.isServer){
	Meteor.publish('dayOffRequests', function(){
		return DayOffRequests.find({}); // TODO
	});
}

Meteor.methods({
	'dayOffRequests.insert'(request){
		const locations = Locations.find({}).fetch();

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
				type: Object,
				label: "Location administrator"
			},
			"requestedLocation.administrator.name": {
				type: String,
				label: "Location administrator name"
			},
			"requestedLocation.administrator.email": {
				type: String,
				label: "Location administrator email"
			}
		}).validate(request);

		if(Meteor.isServer){
			request.ipAddress = this.connection.clientAddress;
			sendNotifications();
		}

		DayOffRequests.insert(request);
	}
});

function getUsersToEmail(){
	return Meteor.users.find({ notify: true });
}

function sendNotifications(){
	const users = getUsersToEmail();
	for(let user of users){
		Email.send({
			to: user.email,
			from: APP_EMAIL_ADDRESS,
			subject: "Notification!",
			text: "test"
		})
	}
}

function sendConfirmationRequests(){

}
