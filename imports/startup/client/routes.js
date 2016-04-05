import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { DayOffRequests } from '../../api/day-off-requests.js';

import find from 'lodash/find';

import '../../ui/layouts';
import '../../ui/templates';


FlowRouter.route('/', {
	name: 'App.home',
	action() {
		BlazeLayout.render('main', { main: 'home' });
	}
});

FlowRouter.route('/list', {
	name: 'Request.list',
	triggersEnter: [AccountsTemplates.ensureSignedIn],
	action(){
		BlazeLayout.render('main', { main: 'requestsList' });
	}
});

FlowRouter.route('/request/:_id', {
	name: "Request.single",
	triggersEnter: [AccountsTemplates.ensureSignedIn],
	action(params){
		BlazeLayout.render('main', { main: 'singleRequest' });
	}
});
