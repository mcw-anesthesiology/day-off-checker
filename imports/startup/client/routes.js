import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AccountsTemplates } from 'meteor/useraccounts:core';

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
	action() {
		BlazeLayout.render('main', { main: 'requestsList' });
	}
});
