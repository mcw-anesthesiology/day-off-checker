import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import find from 'lodash/find';

import './requests.html';


function displayConfirmerName(value, object, key){
	const user = Meteor.users.findOne({ username: value });
	if(user)
		return user.name;
}

Template.requestsList.onCreated(() => {
	Meteor.subscribe('dayOffRequests');
});

Template.requestsList.helpers({
	sickDayRequests(){
		const requests = DayOffRequests.find({ dayOffType: "sick" }, { sort: { createdAt: -1 } });
		if(requests.count() > 0)
			return requests;
		else
			return [{}];
	},
	sickDaySettings(){
		return {
			fields: [
				{ key: 'requestorName', label: 'Name' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'Sick day' },
				{ key: 'requestTime', label: 'Requested' }
			]
		}
	},
	iDayRequests(){
		const requests = DayOffRequests.find({ dayOffType: "iDay" }, { sort: { createdAt: -1 } });
		if(requests.count() > 0)
			return requests;
		else
			return [{}];
	},
	iDaySettings(){
		return {
			fields: [
				{ key: '_id', label: 'ID' },
				{ key: 'requestorName', label: 'Name' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'I-Day' },
				{ key: 'requestTime', label: 'Requested' },
				{ key: 'status', label: 'Status' },
				{ key: 'confirmationRequests.0.confirmer', label: 'Approver', fn: displayConfirmerName },
				{ key: 'confirmationRequests.0.status', label: 'Approval Status' },
				{ key: 'confirmationRequests.1.confirmer', label: 'Approver', fn: displayConfirmerName },
				{ key: 'confirmationRequests.1.status', label: 'Approval Status' },
				{ key: 'confirmationRequests.2.confirmer', label: 'Approver', fn: displayConfirmerName },
				{ key: 'confirmationRequests.2.status', label: 'Approval Status' }
			]
		}
	}
});

function displayConfirmerName(value, object, key){
	const user = Meteor.users.findOne({ username: value });
	if(user)
		return user.name;
}

Template.singleRequest.onCreated(() => {
	Meteor.subscribe('dayOffRequests');
});

Template.singleRequest.helpers({
	request(){
		try {
			return DayOffRequests.find(FlowRouter.getParam('_id'));
		}
		catch(e){
			console.log(e);
			return false;
		}
	},
	requestSettings(){
		return {
			fields: [
				{ key: '_id', label: 'ID' },
				{ key: 'requestorName', label: 'Name' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'I-Day' },
				{ key: 'requestTime', label: 'Requested' },
				{ key: 'status', label: 'Status' },
				{ key: 'confirmationRequests.0.confirmer', label: 'Approver', fn: displayConfirmerName },
				{ key: 'confirmationRequests.0.status', label: 'Approval Status' },
				{ key: 'confirmationRequests.1.confirmer', label: 'Approver', fn: displayConfirmerName },
				{ key: 'confirmationRequests.1.status', label: 'Approval Status' },
				{ key: 'confirmationRequests.2.confirmer', label: 'Approver', fn: displayConfirmerName },
				{ key: 'confirmationRequests.2.status', label: 'Approval Status' }
			]
		}
	},
	needsResponse(){
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
