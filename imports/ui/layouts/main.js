import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import './main.html';

Template.main.helpers({
	currentUserAdmin(){
		return (Meteor.user().role === "admin");
	}
});

Template.main.events({
	'click #logout'(event, instance){
		AccountsTemplates.logout();
	}
})
