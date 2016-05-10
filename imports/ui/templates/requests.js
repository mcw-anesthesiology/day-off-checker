import { Meteor } from 'meteor/meteor';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import find from 'lodash/find';
import moment from 'moment';

import './requests.html';


function displayDate(date){
	if(!date)
		return "Invalid date";
	return moment(date).calendar();
}

function displayDateRange(dates){
	if(!dates || dates.length < 2)
		return "Invalid date range";
	return moment(dates[0]).twix(dates[1], true).format();
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
				{ key: 'requestorName', label: 'Name', sortOrder: 1, sortDirection: 'asc' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'Sick days', fn: displayDateRange },
				{ key: 'requestTime', label: 'Requested', fn: displayDate, sortOrder: 0, sortDirection: 'desc' },
				{ key: 'requestReason', label: 'Reason' },
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
				{ key: 'requestedDate', label: 'I-Days', fn: displayDateRange },
				{ key: 'requestTime', label: 'Requested', fn: displayDate },
				{ key: 'requestReason', label: 'Reason' },
				{ key: 'status', label: 'Status' }
			]
		}
	}
});

Template.requestsList.events({
	'click #logout'(event, instance){
		AccountsTemplates.logout();
	}
})

function displayConfirmerName(value, object, key){
	const user = Meteor.users.findOne({ username: value });
	if(user)
		return user.name;
}

Template.requestDetails.onCreated(() => {
	Meteor.subscribe('dayOffRequests');
});

Template.requestDetails.helpers({
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
				{ key: 'requestedDate', label: 'I-Day', fn: displayDateRange },
				{ key: 'requestTime', label: 'Requested', fn: displayDate },
				{ key: 'requestReason', label: 'Reason' },
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
	},
	submittedResponse(){
		try {
			const request = DayOffRequests.findOne(FlowRouter.getParam('_id'));
			const confirmationRequest = find(request.confirmationRequests, { confirmer: Meteor.user().username });
			return confirmationRequest;
		}
		catch(e){
			return false;
		}
	}
});

Template.requestDetails.events({
	'submit #confirm-request-form'(event, instance){
		event.preventDefault();
		Meteor.call('dayOffRequests.approveRequest', FlowRouter.getParam('_id'), (err, res) => {
			if(err){
				console.log(err.name + ": " + err.message);
				Session.set("errorAlert", "There was a problem approving the request. Please refresh the page and try again. If this problem continues, please let me know at jmischka@mcw.edu.");
			}
		});
	},
	'submit #deny-request-form'(event,instance){
		event.preventDefault();
		const reason = $("#deny-reason").val().trim();
		if(reason == ""){
			Session.set("errorAlert", "Please enter a reason why you are denying the request");
			return;
		}

		Meteor.call('dayOffRequests.denyRequest', FlowRouter.getParam('_id'), reason, (err, res) => {
			if(err){
				console.log(err.name + ": " + err.message);
				Session.set("errorAlert", "There was a problem denying the request. Please refresh the page and try again. If this problem continues, please let me know at jmischka@mcw.edu.");
			}
		});
	}
});
