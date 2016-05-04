import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import '../../api/users.js';

import './usersList.html';

const roleNames = {
	admin: "Administrator",
	location_admin: "Site Administrator",
	chief: "Chief"
};

Template.usersList.onCreated(() => {
	Meteor.subscribe('allUserData');
	Session.set("userToEdit", undefined);
});

Template.usersList.helpers({
	users(){
		return Meteor.users.find({});
	},
	usersSettings(){
		return {
			fields: [
				{ key: "name", label: "Name" },
				{ key: "username", label: "Username" },
				{ key: "emails", label: "Email", fn: getFirstEmail },
				{ key: "role", label: "Role", fn: roleName },
				{ key: "pager", label: "Pager" }
			]
		};
	},
	userToEdit(){
		return Session.get("userToEdit");
	}
});

Template.usersList.events({
	'click #add-user'(){
		Session.set("userToEdit", {});
	},
	'click .reactive-table tbody tr'(event){
		event.preventDefault();
		const user = this;
		Session.set("userToEdit", user);
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
	editing(){
		return Session.get("userToEdit")._id;
	},
	getFirstEmail: getFirstEmail,
	roles(){
		let roles = [];
		for(let i in roleNames){
			roles.push({ id: i, name: roleNames[i] });
		}
		return roles;
	},
	isSelected(role){
		const user = Session.get("userToEdit");
		if(user.role === role)
			return "selected";
	},
	userIsChief(){
		const user = Session.get("userToEdit");
		return user.role === "chief";
	}
});

Template.editUser.events({
	'click .close-edit-user'(event, instance){
		Session.set("userToEdit", undefined);
	},
	'change #role'(event, instance){
		let user = Session.get("userToEdit");
		user.role = event.target.value;
		Session.set("userToEdit", user);
	},
	'submit #edit-user'(event, instance){
		event.preventDefault();
		const form = event.target;
		const formArray = $(form).serializeArray();
		const userId = Session.get("userToEdit")._id;
		let user = {};
		for(let i of formArray){
			user[i.name] = i.value;
		}
		if(userId)
			Meteor.call('updateUser', userId, user, (err, res) => {
				if(err){
					console.log(err.name + ": " + err.message);
					Session.set("errorAlert", "There was a problem updating the user. Please refresh the page and try again. If this problem continues, please let me know at jmischka@mcw.edu.");
				}
				else
					Session.set("userToEdit", undefined);
			});
		else
			Meteor.call('addUser', user, (err, res) => {
				if(err){
					console.log(err.name + ": " + err.message);
					Session.set("errorAlert", "There was a problem adding the user. Please refresh the page and try again. If this problem continues, please let me know at jmischka@mcw.edu.");
				}
				else
					Session.set("userToEdit", undefined);
			});
	}
});
