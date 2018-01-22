import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { throwError } from 'meteor/saucecode:rollbar';

import '../../api/users.js';

import { Fellowships } from '../../api/fellowships.js';
import { ADMIN_EMAIL_ADDRESS } from '../../constants.js';
import { displayNameByUsername } from '../../utils.js';

import './fellowshipsList.html';

Template.fellowshipsList.onCreated(() => {
	Meteor.subscribe('fellowships');
	Meteor.subscribe('fellowshipAdminUserData');
	Session.set('fellowshipToEdit', undefined);
});

Template.fellowshipsList.helpers({
	fellowships(){
		return Fellowships.find();
	},
	editing(){
		return Session.get('fellowshipToEdit')._id;
	},
	fellowshipToEdit(){
		return Session.get('fellowshipToEdit');
	},
	fellowshipsSettings(){
		return {
			fields: [
				{ key: '_id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'number', label: 'Number' },
				{ key: 'administrator', label: 'Director', fn: displayNameByUsername }
			]
		};
	}
});

Template.fellowshipsList.events({
	'click #add-fellowship'(){
		Session.set('fellowshipToEdit', {});
	},
	'click .reactive-table tr'(){
		Session.set('fellowshipToEdit', this);
	}
});

Template.editFellowship.helpers({
	fellowshipAdmins(){
		return Meteor.users.find({
			role: 'fellowship_admin',
			inactive: {
				$in: [
					null,
					false
				]
			}
		}).fetch();
	},
	isFellowshipAdmin(fellowship, fellowshipAdmin){
		if(fellowship.administrator === fellowshipAdmin.username)
			return 'selected';
	}
});

Template.editFellowship.events({
	'click .close-edit-fellowship'(){
		Session.set('fellowshipToEdit', undefined);
	},
	'submit #edit-fellowship'(event){
		event.preventDefault();
		const form = event.target;
		const formArray = $(form).serializeArray();
		const fellowshipId = Session.get('fellowshipToEdit')._id;
		let fellowship = {};
		for(let i of formArray){
			fellowship[i.name] = i.value;
		}
		if(fellowshipId)
			Meteor.call('updateFellowship', fellowshipId, fellowship, (err) => {
				if(err){
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem updating the fellowship. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
					throwError(err.message);
				}
				else
					Session.set('fellowshipToEdit', undefined);
			});
		else
			Meteor.call('addFellowship', fellowship, (err) => {
				if(err){
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem adding the fellowship. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
					throwError(err.message);
				}
				else
					Session.set('fellowshipToEdit', undefined);
			});
	}
});
