import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import '../../ui/body.js';

FlowRouter.route('/', {
	name: 'App.home',
	action() {
		BlazeLayout.render('main', { main: 'home' });
	}
});
