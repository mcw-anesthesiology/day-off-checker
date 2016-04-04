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

FlowRouter.route('/confirmation/:token', {
	name: "Confirmation",
	triggersEnter: [AccountsTemplates.ensureSignedIn],
	action(params){
		Meteor.subscribe('dayOffRequests');
		const request = DayOffRequests.findOne({ "confirmationRequests.token": params.token });
		const confirmationRequest = find(request.confirmationRequests, { token: params.token });

		if(Meteor.user().username === confirmationRequest.confirmer)
			BlazeLayout.render('main', { main: 'confirmation' });
		else
			FlowRouter.go('/'); // FIXME: Error message or something
	}
});
