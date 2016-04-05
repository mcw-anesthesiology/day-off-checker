import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { DayOffRequests } from '../../api/day-off-requests.js';

import find from 'lodash/find';

import './single-request.html';
import './sick-day-request.js';
import './i-day-request.js';

Template.singleRequest.onCreated(() => {
	Meteor.subscribe('dayOffRequests');
});

Template.singleRequest.helpers({
	request(){
		try {
			const request = DayOffRequests.findOne(FlowRouter.getParam('_id'));
			return request;
		}
		catch(e){
			console.log(e);
			return false;
		}
	},
	needsResponse(){
		const instance = Template.instance();
		try {
			const request = DayOffRequests.findOne(FlowRouter.getParam('_id'));
			const confirmationRequest = find(request.confirmationRequests, { confirmer: Meteor.user().username });
			return confirmationRequest.status === "pending" && request.status === "pending";
		}
		catch(e){
			return false;
		}
	}
});

Template.singleRequest.events({
	'submit #confirm-request-form'(event, instance){
		event.preventDefault();
		Meteor.call('dayOffRequests.approveRequest', FlowRouter.getParam('_id'), (err, res) => { // FIXME: Using param unsafe?
			if(err)
				alert(err); // FIXME
		});
	},
	'submit #deny-request-form'(event,instance){
		event.preventDefault();
		const reason = $("#deny-reason").val().trim();
		if(reason == ""){
			alert("Please enter a reason why you are denying the request");
			return;
		}

		Meteor.call('dayOffRequests.denyRequest', FlowRouter.getParam('_id'), reason, (err, res) => { // FIXME: Using param unsafe?
			if(err)
				alert(err); // FIXME
		});
	}
});
