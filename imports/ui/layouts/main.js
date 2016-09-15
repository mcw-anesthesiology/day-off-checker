import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { DAY_OFF_FIELDS } from '../../constants.js';
import { isFellow } from '../../utils.js';

import './main.html';

Template.main.onRendered(function(){
	Meteor.subscribe('currentUserData');
});

Template.main.helpers({
	isFellowSelected(){
		if(isFellow())
			return 'selected';
	},
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
	},
	fieldEntries(){
		let fields = Object.values(DAY_OFF_FIELDS).filter(field => {
			if(field === DAY_OFF_FIELDS.FELLOWSHIP){
				return isFellow();
			}

			return true;
		});

		for(let field of fields){
			if(Session.get(field))
				return true;
		}

		return false;
	}
});

Template.main.events({
	'click .error-alert .close'(){
		Session.set('errorAlert', undefined);
	},
	'click #logout'(){
		AccountsTemplates.logout();
	},
	'change #site-header-user-type'(event){
		
	}
});
