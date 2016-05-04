import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import map from 'lodash/map';

export const Locations = new Mongo.Collection('locations');

if(Meteor.isServer){
	Meteor.publish('locations', function(){
		return Locations.find({});
	});
}

if(Meteor.isClient){
	Meteor.subscribe('allUserData'); // FIXME ?
}

Meteor.methods({
	'addLocation'(location){
		if(Meteor.user().role !== "admin")
			throw new Meteor.Error('addLocation.unauthorized');

		const locationAdmins = Meteor.users.find({ role: "location_admin" }).fetch();

		new SimpleSchema({
			_id: {
				type: String,
				label: "Location ID",
			},
			name: {
				type: String,
				label: "Location name"
			},
			number: {
				type: String,
				label: "Location number" // TODO: restrict this to actual numbers?
			},
			administrator: {
				type: String,
				label: "Location administrator username",
				allowedValues: map(locationAdmins, "username")
			}
		}).validate(location);

		Locations.insert(location);

		if(Meteor.isServer){
			notifyNewLocationAdmin(location);
		}
	}
	'updateLocation'(locationId, location){ // TODO: More validation
		if(Meteor.user().role !== "admin")
			throw new Meteor.Error('updateLocation.unauthorized');

		const locationAdmins = Meteor.users.find({ role: "location_admin" }).fetch();

		new SimpleSchema({
			_id: {
				type: String,
				label: "Location ID",
			},
			name: {
				type: String,
				label: "Location name"
			},
			number: {
				type: String,
				label: "Location number" // TODO: restrict this to actual numbers?
			},
			administrator: {
				type: String,
				label: "Location administrator username",
				allowedValues: map(locationAdmins, "username")
			}
		}).validate(location);

		const oldLocation = Locations.findOne(locationId);

		Locations.update(locationId, location);

		if(Meteor.isServer && oldLocation.administrator !== location.administrator){
			notifyNewLocationAdmin(location);
		}
	}
});

function notifyNewLocationAdmin(location){
	// TODO
}
