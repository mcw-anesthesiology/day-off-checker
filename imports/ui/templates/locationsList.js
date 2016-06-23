import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Locations } from '../../api/locations.js';
import '../../api/users.js';
import { ADMIN_EMAIL_ADDRESS } from '../../constants.js';

import './locationsList.html';

Template.locationsList.onCreated(() => {
	Meteor.subscribe('locations');
	Meteor.subscribe('locationAdminUserData');
	Session.set('locationToEdit', undefined);
});

Template.locationsList.helpers({
	locations(){
		return Locations.find();
	},
	editing(){
		return Session.get('locationToEdit')._id;
	},
	locationToEdit(){
		return Session.get('locationToEdit');
	},
	locationsSettings(){
		return {
			fields: [
				{ key: '_id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'number', label: 'Number' },
				{ key: 'administrator', label: 'Administrator' }
			]
		};
	}
});

Template.locationsList.events({
	'click #add-location'(){
		Session.set('locationToEdit', {});
	},
	'click .reactive-table tr'(){
		Session.set('locationToEdit', this);
	}
});

Template.editLocation.helpers({
	siteAdmins(){
		return Meteor.users.find({ role: 'location_admin' }).fetch();
	},
	isSiteAdmin(location, siteAdmin){
		if(location.administrator === siteAdmin.username)
			return 'selected';
	}
});

Template.editLocation.events({
	'click .close-edit-location'(){
		Session.set('locationToEdit', undefined);
	},
	'submit #edit-location'(event){
		event.preventDefault();
		const form = event.target;
		const formArray = $(form).serializeArray();
		const locationId = Session.get('locationToEdit')._id;
		let location = {};
		for(let i of formArray){
			location[i.name] = i.value;
		}
		if(locationId)
			Meteor.call('updateLocation', locationId, location, (err) => {
				if(err){
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem updating the location. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
				}
				else
					Session.set('locationToEdit', undefined);
			});
		else
			Meteor.call('addLocation', location, (err) => {
				if(err){
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem adding the location. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
				}
				else
					Session.set('locationToEdit', undefined);
			});
	}
});
