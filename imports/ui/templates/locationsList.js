import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { throwError } from 'meteor/saucecode:rollbar';

import { Locations } from '../../api/locations.js';
import { Fellowships } from '../../api/fellowships.js';
import '../../api/users.js';
import { ADMIN_EMAIL_ADDRESS } from '../../constants.js';
import { displayNameByUsername, isFellow } from '../../utils.js';

import EditLocation from '../components/EditLocation.js';

import './locationsList.html';

Template.locationsList.onCreated(function(){
	Meteor.subscribe('locations');
	Meteor.subscribe('locationAdminUserData');
	Session.set('locationToEdit', undefined);
	if(isFellow()){
		Meteor.subscribe('fellowships');
		this.fellowshipLocationsToEdit = new ReactiveDict();
	}
});

Template.locationsList.helpers({
	locations(){
		return Locations.find({
			fellowship: {
				$exists: false
			}
		});
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
				{ key: 'administrator', label: 'Administrator', fn: displayNameByUsername }
			],
			class: 'resident-locations table table-striped'
		};
	},

	fellowships(){
		return Fellowships.find();
	},
	fellowshipLocations(id){
		return Locations.find({
			fellowship: id
		});
	},
	fellowshipLocationToEdit(id){
		return Template.instance().fellowshipLocationsToEdit.get(id);
	},
	fellowshipLocationsSettings(id){
		return {
			fields: [
				{ key: '_id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'number', label: 'Number' },
				{ key: 'administrator', label: 'Administrator', fn: displayNameByUsername }
			],
			class: 'fellowship-locations table table-striped',
			rowClass: id
		};
	},

	EditLocation(){
		return EditLocation;
	},
	siteAdmins(){
		return Meteor.users.find({
			role: 'location_admin',
			inactive: {
				$in: [
					null,
					false
				]
			}
		}).fetch();
	},
	handleLocationSubmit(fellowshipId){
		const instance = Template.instance();
		return () => { // Okay blaze sucks
			return location => {
				const locationId = instance.fellowshipLocationsToEdit.get(fellowshipId)._id;
				if(locationId)
					Meteor.call('updateLocation', locationId, location, (err) => {
						if(err){
							console.log(err.name + ': ' + err.message);
							Session.set('errorAlert', 'There was a problem updating the location. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
							throwError(err.message);
						}
						else
							instance.fellowshipLocationsToEdit.set(fellowshipId, undefined);
					});
				else
					Meteor.call('addLocation', location, (err) => {
						if(err){
							console.log(err.name + ': ' + err.message);
							Session.set('errorAlert', 'There was a problem adding the location. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
							throwError(err.message);
						}
						else
							instance.fellowshipLocationsToEdit.set(fellowshipId, undefined);
					});
			};
		};
	},
	handleCancel(id){
		const instance = Template.instance();
		return () => { // Okay blaze sucks
			return () => {
				instance.fellowshipLocationsToEdit.set(id, undefined);
			};
		};
	},
});

Template.locationsList.events({
	'click #add-location'(){
		Session.set('locationToEdit', {});
	},
	'click .resident-locations tr'(){
		Session.set('locationToEdit', this);
	},

	'click #add-fellowship-location'(event, instance){
		const fellowship = event.target.dataset.fellowship;
		instance.fellowshipLocationsToEdit.set(fellowship, {
			_id: '',
			name: '',
			number: '',
			administrator: ''
		});
	},
	'click .fellowship-locations tr'(event, instance){
		const fellowship = event.target.parentElement.className.trim();
		instance.fellowshipLocationsToEdit.set(fellowship, this);
	}
});

Template.editLocation.helpers({
	siteAdmins(){
		return Meteor.users.find({
			role: 'location_admin',
			inactive: {
				$in: [
					null,
					false
				]
			}
		}).fetch();
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
					throwError(err.message);
				}
				else
					Session.set('locationToEdit', undefined);
			});
		else
			Meteor.call('addLocation', location, (err) => {
				if(err){
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem adding the location. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
					throwError(err.message);
				}
				else
					Session.set('locationToEdit', undefined);
			});
	}
});
