import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './usersList.html';

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
				{ key: "role", label: "Role" },
				{ key: "pager", label: "Pager" }
			]
		};
	}
});

Template.usersList.events({

});

function getFirstEmail(emails){
	return emails[0].address;
}
