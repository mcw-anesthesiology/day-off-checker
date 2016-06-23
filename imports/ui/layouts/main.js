import { Meteor } from 'meteor/meteor';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import './main.html';

Template.main.onRendered(function(){
	Meteor.subscribe('currentUserData');
});

Template.main.helpers({
	errorAlert(){
		return Session.get('errorAlert');
	}
});

Template.main.events({
	'click .error-alert .close'(){
		Session.set('errorAlert', undefined);
	},
	'click #logout'(){
		AccountsTemplates.logout();
	}
});
