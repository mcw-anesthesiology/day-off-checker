import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import find from 'lodash/find';
import moment from 'moment';
import 'twix';

import { displayDate, displayDateRange, capitalizeFirstLetter } from '../../utils.js';

import './requests.html';


Template.requestsList.onCreated(function(){
	Meteor.subscribe('dayOffRequests'); // FIXME: Make sure these permissions make sense
});

Template.requestsList.helpers({
	sickDayDetails(){
		return DayOffRequests.findOne(Session.get("sickDayDetailsId"));
	},
	sickDayRequests(){
		const requests = DayOffRequests.find({ dayOffType: "sick" }, { sort: { createdAt: -1 } });
		if(requests.count() > 0)
			return requests;
		else
			return [{}];
	},
	sickDaySettings(){ // FIXME: Sorting with dates
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
		return DayOffRequests.findOne(Session.get('iDayDetailsId'));
	},
	iDayRequests(){
		const requests = DayOffRequests.find({ dayOffType: "iDay" }, { sort: { createdAt: -1 } });
		if(requests.count() > 0)
			return requests;
		else
			return [{}];
	},
	iDaySettings(){ // FIXME: Sorting with dates
		return {
			fields: [
				{ key: 'requestorName', label: 'Name' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'I-Days', fn: displayDateRange },
				{ key: 'requestTime', label: 'Requested', fn: displayDate },
				{ key: 'requestReason', label: 'Reason' },
				{ key: 'status', label: 'Status', fn: capitalizeFirstLetter }
			]
		}
	}
});

Template.requestsList.events({
	'click #close-sick-day-details'(event){
		Session.set("sickDayDetailsId", undefined);
	},
	'click .sick-day-requests tr'(event){
		Session.set("sickDayDetailsId", this._id);
	},
	'click #close-i-day-details'(event){
		Session.set("iDayDetailsId", undefined);
	},
	'click .i-day-requests tr'(event){
		Session.set("iDayDetailsId", this._id);
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
