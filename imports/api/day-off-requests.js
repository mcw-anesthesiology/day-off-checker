import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Locations } from './locations.js';

import moment from 'moment';
import map from 'lodash/map';

export const DayOffRequests = new Mongo.Collection('dayOffRequests');

Meteor.methods({
	'dayOffRequests.insert'(request){
		const locations = Locations.find({}).fetch();
		console.log(map(locations, "_id"));
		console.log(map(locations, "name"));
		console.log(map(locations, "number"));
		console.log(request);

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
			}
		}).validate(request);

		request.ipAddress = this.connection.clientAddress;

		DayOffRequests.insert(request);
	}
});
