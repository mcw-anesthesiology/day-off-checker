import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Locations } from '../../api/locations.js';

import './locationsList.html';

Template.locationsList.onCreated(() => {
	Meteor.subscribe('Locations');
	Session.set("locationToEdit", undefined);
});

Template.locationsList.helpers({
	locations(){
		return Locations.find();
	},
	locationToEdit(){
		return Session.get("locationToEdit");
	},
	locationsSettings(){
		return {
			fields: [
				{ key: "_id", label: "ID" },
				{ key: "name", label: "Name" },
				{ key: "number", label: "Number" },
				{ key: "administrator", label: "Administrator" }
			]
		};
	}
});

Template.locationsList.events({

});

Template.editLocation.helpers({
	users(){ // TODO
		return [];
	}
});

Template.editLocation.events({
	'click .close-edit-location'(){
		Session.set("locationToEdit", undefined);
	},
	'submit #edit-location'(event, instance){
		event.preventDefault();
		const form = event.target;
		const formArray = $(form).serializeArray();
		const locationId = Session.get('locationToEdit')._id;
		let location = {};
		for(let i of formArray){
			location[i.name] = i.value;
		}
		if(locationId)
			Meteor.call('updateLocation', locationId, location, (err, res) => { // TODO
				if(err)
					alert(err); // FIXME
				else
					Session.set('locationToEdit', undefined);
			});
		else
			Meteor.call('addLocation', location, (err, res) => { // TODO
				if(err)
					alert(err); // FIXME
				else
					Session.set('locationToEdit', undefined);
			});
	}
});
