import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Locations = new Mongo.Collection('locations');

if(Meteor.isServer){
	Meteor.publish('locations', function(){
		return Locations.find({});
	});
}

Meteor.methods({
	'updateLocation'(){
		// TODO
	},
	'addLocation'(){
		// TODO
	}
});
