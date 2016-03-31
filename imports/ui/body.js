import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';

import './body.html';

Template.main.helpers({

});

Template.home.helpers({
	dayOffButtons: [
		{ text: "Sick day", id: "sick" },
		{ text: "I-Day", id: "iDay" }
	],
});

Template.home.events({
	'click .day-off-button'(event, instance) {
		const target = event.target;
		const id = target.id;

		Session.set('dayOffType', id);
	}
});
