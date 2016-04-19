import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './usersList.html';

const roleNames = {
	admin: "Administrator",
	location_admin: "Site Administrator",
	chief: "Chief"
};

Template.usersList.onCreated(() => {
	Meteor.subscribe('allUserData');
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
	'click .reactive-table tbody tr'(){
		event.preventDefault();
		const user = this;
		Session.set("userToEdit", user);
	}
});

function getFirstEmail(emails){
	return emails[0].address;
}

function roleName(role){
	return roleNames[role];
}

Template.editUser.helpers({
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
		return $("#role").val() === "chief";
	}
});

Template.editUser.events({

});
