import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { DayOffRequests } from '../../api/day-off-requests.js';

import find from 'lodash/find';

import './single-request.html';
import './request-row.js';

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
