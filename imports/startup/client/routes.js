import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import '../../ui/body.js';
import '../../ui/templates';

FlowRouter.route('/', {
	name: 'App.home',
	action() {
		BlazeLayout.render('main', { main: 'home' });
	}
});

FlowRouter.route('/list', {
	name: 'Request.list',
	action() {
		BlazeLayout.render('main', { main: 'requestsList' });
	}
});
