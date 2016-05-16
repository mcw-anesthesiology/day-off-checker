import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import './main.html';

Template.main.onRendered(function(){
	Meteor.subscribe("currentUserData");
});

Template.main.helpers({
	errorAlert(){
		return Session.get("errorAlert");
	}
});

Template.main.events({
	'click .error-alert .close'(){
		Session.set("errorAlert", undefined);
	},
	'click #logout'(event, instance){
		AccountsTemplates.logout();
	}
})
