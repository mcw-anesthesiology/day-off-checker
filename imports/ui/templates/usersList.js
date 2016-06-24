import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import '../../api/users.js';
import { ADMIN_EMAIL_ADDRESS } from '../../constants.js';

import './usersList.html';

const roleNames = {
	admin: 'Administrator',
	location_admin: 'Site Administrator',
	chief: 'Chief',
	fellowship_admin: 'Fellowship Administrator'
};

Template.usersList.onCreated(() => {
	Meteor.subscribe('allUserData');
	Session.set('userToEdit', undefined);
});

Template.usersList.helpers({
	users(){
		return Meteor.users.find({});
	},
	usersSettings(){
		return {
			fields: [
				{ key: 'name', label: 'Name' },
				{ key: 'username', label: 'Username' },
				{ key: 'emails', label: 'Email', fn: getFirstEmail },
				{ key: 'role', label: 'Role', fn: roleName },
				{ key: 'pager', label: 'Pager' }
			]
		};
	},
	userToEdit(){
		return Session.get('userToEdit');
	}
});

Template.usersList.events({
	'click #add-user'(){
		Session.set('userToEdit', {});
	},
	'click .reactive-table tbody tr'(event){
		event.preventDefault();
		const user = this;
		Session.set('userToEdit', user);
	}
});

function getFirstEmail(emails){
	if(emails && emails.length > 0)
		return emails[0].address;
}

function roleName(role){
	return roleNames[role];
}

Template.editUser.helpers({
	editing(user){
		return user._id;
	},
	getFirstEmail: getFirstEmail,
	roles(){
		let roles = [];
		for(let i in roleNames){
			roles.push({ id: i, name: roleNames[i] });
		}
		return roles;
	},
	isSelected(user, role){
		if(user.role === role)
			return 'selected';
	},
	userIsChief(user){
		return user.role === 'chief';
	},
	notifySelected(user){
		if(user.notify)
			return 'checked';
	}
});

Template.editUser.events({
	'click .close-edit-user'(){
		Session.set('userToEdit', undefined);
	},
	'change #role'(event){
		let user = Session.get('userToEdit');
		user.role = event.target.value;
		Session.set('userToEdit', user);
	},
	'click #resend-enrollment-email'(){
		const userId = Session.get('userToEdit')._id;
		Meteor.call('resendEnrollmentEmail', userId, (err) => {
			if(err){
				console.log(err.name + ': ' + err.message);
				Session.set('errorAlert', 'There was a problem resending the enrollment email. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
			}
			else
				Session.set('userToEdit', undefined);
		});
	},
	'submit #edit-user'(event){
		event.preventDefault();
		const form = event.target;
		const formArray = $(form).serializeArray();
		const userId = Session.get('userToEdit')._id;
		let user = {};
		for(let i of formArray){
			user[i.name] = i.value;
		}
		if(userId)
			Meteor.call('updateUser', userId, user, (err) => {
				if(err){
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem updating the user. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
				}
				else
					Session.set('userToEdit', undefined);
			});
		else
			Meteor.call('addUser', user, (err) => {
				if(err){
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem adding the user. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
				}
				else
					Session.set('userToEdit', undefined);
			});
	}
});
