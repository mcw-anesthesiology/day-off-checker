import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { DayOffRequests } from '../../api/day-off-requests.js';

import find from 'lodash/find';

import '../../ui/layouts';
import '../../ui/templates';


BlazeLayout.setRoot('body');

FlowRouter.route('/', {
	name: 'Home',
	// TODO: Maybe?
	// triggersEnter: [() => {
	// 	if(Meteor.user())
	// 		FlowRouter.go('/list');
	// }],
	action() {
		BlazeLayout.render('main', { main: 'home' });
	}
});

FlowRouter.route('/list', {
	name: 'List',
	triggersEnter: [AccountsTemplates.ensureSignedIn],
	action(){
		BlazeLayout.render('main', { main: 'requestsList' });
	}
});

FlowRouter.route('/request/:_id', {
	name: 'Request',
	triggersEnter: [AccountsTemplates.ensureSignedIn],
	action(params){
		BlazeLayout.render('main', { main: 'singleRequest' });
	}
});

FlowRouter.route('/users', {
	name: 'Users',
	triggersEnter: [AccountsTemplates.ensureSignedIn, (context, redirect, stop) => {
		if(Meteor.user() && Meteor.user().role !== 'admin')
			redirect('/');
	}],
	action(params){
		BlazeLayout.render('main', { main: 'usersList' });
	}
});

FlowRouter.route('/locations', {
	name: 'Locations',
	triggersEnter: [AccountsTemplates.ensureSignedIn, (context, redirect, stop) => {
		if(Meteor.user() && Meteor.user().role !== 'admin')
			redirect('/');
	}],
	action(params){
		BlazeLayout.render('main', { main: 'locationsList' });
	}
});
