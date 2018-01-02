import { Meteor } from 'meteor/meteor';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { DAY_OFF_FIELDS, REQUESTOR_TYPES } from '../../constants.js';
import { isFellow, userTypeUrl, isRequestorType } from '../../utils.js';

import './main.html';

Template.main.onRendered(function(){
	Meteor.subscribe('currentUserData');
});

Template.main.helpers({
	userTypeUrl,
	requestorTypes() {
		return REQUESTOR_TYPES;
	},
	requestorTypeSelected(type) {
		return isRequestorType(type)
			? 'selected'
			: null;
	},
	errorAlert(){
		return Session.get('errorAlert');
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
		window.location = userTypeUrl(event.target.value);
	}
});
