import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import './main.html';

Template.main.onRendered(function(){
	Meteor.subscribe('currentUserData');
});

Template.main.helpers({
	errorAlert(){
		return Session.get('errorAlert');
	},
	residentUrl(){
		FlowRouter.watchPathChange();
		return document.location.host.substring(document.location.host.indexOf('.') + 1)
			+ FlowRouter.current().path;
	},
	fellowUrl(){
		FlowRouter.watchPathChange();
		return 'fellow.' + document.location.host + FlowRouter.current().path;
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
