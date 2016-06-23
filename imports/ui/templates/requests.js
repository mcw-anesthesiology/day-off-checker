import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { DayOffRequests } from '../../api/day-off-requests.js';

import find from 'lodash/find';
import 'twix';

import { ADMIN_EMAIL_ADDRESS } from '../../constants.js';
import { displayDate, displayDateRange, capitalizeFirstLetter } from '../../utils.js';

import './requests.html';

function displaySortableDate(date){
	try {
		const dateString = displayDate(date);
		return new Spacebars.SafeString(`<span sort="${date.getTime()}">${dateString}</span>`);
	}
	catch(e){
		return '';
	}
}

function displaySortableDateRange(dates){
	try{
		const dateRangeString = displayDateRange(dates);
		return new Spacebars.SafeString(`<span sort="${dates[1].getTime()}">${dateRangeString}</span>`);
	}
	catch(e){
		return '';
	}
}

Template.requestsList.onCreated(function(){
	Meteor.subscribe('dayOffRequests');
});

Template.requestsList.helpers({
	sickDayDetails(){
		return DayOffRequests.findOne(Session.get('sickDayDetailsId'));
	},
	sickDayRequests(){
		const requests = DayOffRequests.find({ dayOffType: 'sick' }, { sort: { createdAt: -1 } });
		if(requests.count() > 0)
			return requests;
		else
			return [{}];
	},
	sickDaySettings(){
		return {
			fields: [
				{ key: 'requestorName', label: 'Name', sortOrder: 2, sortDirection: 'asc' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'Sick days', fn: displaySortableDateRange, sortOrder: 0, sortDirection: 'desc' },
				{ key: 'requestTime', label: 'Requested', fn: displaySortableDate, sortOrder: 1, sortDirection: 'desc' },
				{ key: 'requestReason', label: 'Reason' }
			]
		};
	},
	iDayDetails(){
		return DayOffRequests.findOne(Session.get('iDayDetailsId'));
	},
	iDayRequests(){
		const requests = DayOffRequests.find({ dayOffType: 'iDay' }, { sort: { createdAt: -1 } });
		if(requests.count() > 0)
			return requests;
		else
			return [{}];
	},
	iDaySettings(){
		return {
			fields: [
				{ key: 'requestorName', label: 'Name', sortOrder: 2, sortDirection: 'asc' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'I-Days', fn: displaySortableDateRange, sortOrder: 0, sortDirection: 'desc' },
				{ key: 'requestTime', label: 'Requested', fn: displaySortableDate, sortOrder: 1, sortDirection: 'desc' },
				{ key: 'requestReason', label: 'Reason' },
				{ key: 'status', label: 'Status', fn: capitalizeFirstLetter },
				{ key: 'confirmationRequests', label: '', fn: iDayNeedsResponse }
			]
		};
	}
});

function iDayNeedsResponse(confirmationRequests, request){
	try {
		const confirmationRequest = find(confirmationRequests, { confirmer: Meteor.user().username });
		if(confirmationRequest.status === 'pending' && request.status === 'pending'){
			console.log('okay');
			return Spacebars.SafeString('<span class="i-day-needs-response-icon"></span>');
		}
	}
	catch(e){
		return false;
	}
}

Template.requestsList.events({
	'click #close-sick-day-details'(){
		Session.set('sickDayDetailsId', undefined);
	},
	'click .sick-day-requests tr'(event, instance){
		Session.set('sickDayDetailsId', this._id);
		instance.$('#sick-day-details')[0].scrollIntoView();
	},
	'click #close-i-day-details'(){
		Session.set('iDayDetailsId', undefined);
	},
	'click .i-day-requests tr'(event, instance){
		Session.set('iDayDetailsId', this._id);
		instance.$('#i-day-details')[0].scrollIntoView();
	}
});

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
	// this.$('#daterange').daterangepicker();
	// FIXME: No one on god's earth knows why this doesn't work
// });

Template.requestDetails.helpers({
	isIDay(request){
		return (request.dayOffType === 'iDay');
	},
	// requestDates(request){
	// 	let range = moment(request.requestedDate[0]).twix(request.requestedDate[1], true);
	// 	return range.simpleFormat('MM/DD/YYYY');
	// },
	notDenied(request){
		return (request.status !== 'denied');
	},
	displayISODate(date){
		return date.toISOString();
	},
	confirmationRequests(request){
		return request.confirmationRequests;
	},
	isPending(confirmationRequest){
		return (confirmationRequest.status === 'pending');
	},
	statusLabelType(status){
		const labelTypes = {
			pending: 'warning',
			approved: 'success',
			denied: 'danger'
		};

		try {
			return `label-${labelTypes[status]}`;
		}
		catch(e){
			console.log(e);
			return 'label-default';
		}
	},
	needsResponse(request){
		try {
			const confirmationRequest = find(request.confirmationRequests, { confirmer: Meteor.user().username });
			return confirmationRequest.status === 'pending' && request.status === 'pending';
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
	},
	approvedRequest(confirmationRequest){
		return (confirmationRequest.status === 'approved');
	},
	resendConfirmationRequests(){
		return Session.equals('requestDetailAdminAction', 'resend-confirmation-requests');
	}
});

Template.requestDetails.events({
	'submit #confirm-request-form'(event, instance){
		event.preventDefault();
		const requestId = instance.$('#confirm-request-id').val();
		const note = instance.$('#confirm-note').val();
		Meteor.call('dayOffRequests.approveRequest', requestId, note, (err) => {
			if(err){
				console.log(err.name + ': ' + err.message);
				Session.set('errorAlert', 'There was a problem approving the request. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
			}
		});
	},
	'submit #deny-request-form'(event, instance){
		event.preventDefault();
		const requestId = instance.$('#deny-request-id').val();
		const reason = instance.$('#deny-reason').val().trim();
		if(reason === ''){
			Session.set('errorAlert', 'Please enter a reason why you are denying the request');
			return;
		}

		Meteor.call('dayOffRequests.denyRequest', requestId, reason, (err) => {
			if(err){
				console.log(err.name + ': ' + err.message);
				Session.set('errorAlert', 'There was a problem denying the request. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
			}
		});
	},
	'click #resend-confirmation-requests'(){
		Session.set('requestDetailAdminAction', 'resend-confirmation-requests');
	},
	'click #close-resend-confirmation-requests'(){
		Session.set('requestDetailAdminAction', undefined);
	},
	'submit #resend-confirmation-requests-form'(event, instance){
		event.preventDefault();
		const requestId = instance.$('#resend-confirmation-requests-request-id').val();
		const form = event.target;
		const formArray = $(form).serializeArray();
		let resendUsernames = [];
		for(let i of formArray){
			if(i.name === 'resend_username')
				resendUsernames.push(i.value);
		}
		if(resendUsernames.length > 0){
			Meteor.call('dayOffRequests.resendConfirmationRequests', requestId, resendUsernames, (err) => {
				if(err){
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem resending the requests. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
				}
				else
					Session.set('requestDetailAdminAction', undefined);
			});
		}
	},
	'submit #confirmation-request-note-edit-form'(event, instance){
		event.preventDefault();
		const requestId = instance.$('#note-request-id').val();
		const note = instance.$('#confirmation-request-note').val().trim();
		Meteor.call('dayOffRequests.editApprovalNote', requestId, note, (err) => {
			if(err){
				console.log(err.name + ': ' + err.message);
				Session.set('errorAlert', 'There was a problem editing the approval note. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
			}
		});
	}
});
