import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import find from 'lodash/find';
import moment from 'moment';
import 'twix';

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

Template.requestsList.onCreated(function(){
	Meteor.subscribe('dayOffRequests'); // FIXME: Make sure these permissions make sense
});

Template.requestsList.helpers({
	sickDayDetails(){
		return Session.get("sickDayDetails");
	},
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
	iDayDetails(){
		return Session.get("iDayDetails");
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
	'click .sick-day-requests tr'(event){
		Session.set("sickDayDetails", this); // FIXME: This isn't reactive. Because of reactiveTable?
	},
	'click .i-day-requests tr'(event){
		Session.set("iDayDetails", this); // FIXME: This isn't reactive. Because of reactiveTable?
	}
})

Template.singleRequestPage.helpers({
	request(){
		try {
			return DayOffRequests.findOne(FlowRouter.getParam('_id'));
		}
		catch(e){
			console.log(e);
			return false;
		}
	}
});

Template.requestDetails.onCreated(function(){
	Meteor.subscribe('dayOffRequests');
});

// Template.requestDetails.onRendered(function(){
	// this.$("#daterange").daterangepicker();
	// FIXME: No one on god's earth knows why this doesn't work
// });

Template.requestDetails.helpers({
	isIDay(request){
		return (request.dayOffType === "iDay");
	},
	// requestDates(request){
	// 	let range = moment(request.requestedDate[0]).twix(request.requestedDate[1], true);
	// 	return range.simpleFormat("MM/DD/YYYY");
	// },
	displayISODate(date){
		return date.toISOString();
	},
	confirmationRequests(request){
		return request.confirmationRequests;
	},
	statusLabelType(status){
		const labelTypes = {
			pending: "warning",
			approved: "success",
			denied: "danger"
		};

		try {
			return `label-${labelTypes[status]}`;
		}
		catch(e){
			console.log(e);
			return "label-default";
		}
	},
	needsResponse(request){
		try {
			const confirmationRequest = find(request.confirmationRequests, { confirmer: Meteor.user().username });
			return confirmationRequest.status === "pending" && request.status === "pending";
		}
		catch(e){
			return false;
		}
	},
	submittedResponse(request){
		try {
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
		const requestId = instance.$("#confirm-request-id").val();
		Meteor.call('dayOffRequests.approveRequest', requestId, (err, res) => {
			if(err){
				console.log(err.name + ": " + err.message);
				Session.set("errorAlert", "There was a problem approving the request. Please refresh the page and try again. If this problem continues, please let me know at jmischka@mcw.edu.");
			}
		});
	},
	'submit #deny-request-form'(event, instance){
		event.preventDefault();
		const requestId = instance.$("#deny-request-id").val();
		const reason = instance.$("#deny-reason").val().trim();
		if(reason == ""){
			Session.set("errorAlert", "Please enter a reason why you are denying the request");
			return;
		}

		Meteor.call('dayOffRequests.denyRequest', requestId, reason, (err, res) => {
			if(err){
				console.log(err.name + ": " + err.message);
				Session.set("errorAlert", "There was a problem denying the request. Please refresh the page and try again. If this problem continues, please let me know at jmischka@mcw.edu.");
			}
		});
	}
});
