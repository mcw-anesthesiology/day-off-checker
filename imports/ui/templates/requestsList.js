import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { throwError } from 'meteor/saucecode:rollbar';

import { DayOffRequests } from '../../api/day-off-requests.js';
import { ReminderEmails } from '../../api/reminder-emails.js';

import find from 'lodash/find';
import moment from 'moment';
import 'twix';

import {
	ADMIN_EMAIL_ADDRESS,
	DAYS_BEFORE_REQUEST_TO_SEND_REMINDER,
	DAY_OFF_FIELDS,
	DAY_OFF_TYPES,
	DAY_OFF_TYPE_NAMES
} from '../../constants.js';
import { displayDate, displayDateRange, capitalizeFirstLetter } from '../../utils.js';

import './requestsList.html';

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
	Meteor.subscribe('allUserData');
});

Template.requestsList.helpers({
	sickDayDetails(){
		return DayOffRequests.findOne(Session.get('sickDayDetailsId'));
	},
	sickDayRequests(){
		const requests = DayOffRequests.find(
			{ [DAY_OFF_FIELDS.TYPE]: DAY_OFF_TYPES.SICK },
			{ sort: { createdAt: -1 } }
		);
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
		const requests = DayOffRequests.find(
			{ [DAY_OFF_FIELDS.TYPE]: DAY_OFF_TYPES.I_DAY },
			{ sort: { createdAt: -1 } }
		);
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
				{ key: 'confirmationRequests', label: '', fn: requestNeedsResponse }
			]
		};
	},
	fellowRequestDetails(){
		return DayOffRequests.findOne(Session.get('iDayDetailsId'));
	},
	fellowRequestRequests(){
		const requests = DayOffRequests.find(
			{
				[DAY_OFF_FIELDS.TYPE]: {
					$in: [
						DAY_OFF_TYPES.MEETING,
						DAY_OFF_TYPES.VACATION
					]
				}
			},
			{ sort: { createdAt: -1 } }
		);
		if(requests.count() > 0)
			return requests;
		else
			return [{}];
	},
	fellowRequestSettings(){
		return {
			fields: [
				{ key: DAY_OFF_FIELDS.TYPE, label: 'Request Type', fn: displayTypeName },
				{ key: 'requestorName', label: 'Name', sortOrder: 2, sortDirection: 'asc' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'Dates', fn: displaySortableDateRange, sortOrder: 0, sortDirection: 'desc' },
				{ key: 'requestTime', label: 'Requested', fn: displaySortableDate, sortOrder: 1, sortDirection: 'desc' },
				{ key: 'requestReason', label: 'Reason' },
				{ key: 'status', label: 'Status', fn: capitalizeFirstLetter },
				{ key: 'confirmationRequests', label: '', fn: requestNeedsResponse }
			]
		};
	}
});

function displayTypeName(type){
	return DAY_OFF_TYPE_NAMES[type];
}

function requestNeedsResponse(confirmationRequests, request){
	try {
		const confirmationRequest = find(confirmationRequests, { confirmer: Meteor.user().username });
		if(confirmationRequest.status === 'pending' && request.status === 'pending'){
			return Spacebars.SafeString('<span class="request-needs-response-icon"></span>');
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
	},
	'click #close-i-day-details'(){
		Session.set('iDayDetailsId', undefined);
	},
	'click .i-day-requests tr'(event, instance){
		Session.set('iDayDetailsId', this._id);
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
	Meteor.subscribe('reminderEmails');
});

// Template.requestDetails.onRendered(function(){
	// this.$('#daterange').daterangepicker();
	// FIXME: No one on god's earth knows why this doesn't work
// });

Template.requestDetails.helpers({
	isRequest(request){
		return (request[DAY_OFF_FIELDS.TYPE] !== DAY_OFF_TYPES.SICK);
	},
	requestTypeName(request){
		return DAY_OFF_TYPE_NAMES[request[DAY_OFF_FIELDS.TYPE]];
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
	userIsLocationAdmin(user){
		return (user.role === 'location_admin');
	},
	userReminderScheduled(username, request){
		return ReminderEmails.findOne({
			requestId: request._id,
			remindedUser: username,
			status: 'pending'
		});
	},
	userReminderSent(username, request){
		const reminder = ReminderEmails.findOne({
			requestId: request._id,
			remindedUser: username,
			status: 'sent'
		});
		return reminder;
	},
	reminderCanBeScheduled(request){
		return (request.requestedDate[0] > moment()
				.add(DAYS_BEFORE_REQUEST_TO_SEND_REMINDER, 'days')
			&& request.status === 'approved');
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
				throwError(err.message);
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
				throwError(err.message);
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
					throwError(err.message);
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
				throwError(err.message);
			}
		});
	},
	'click #schedule-reminder-button'(event, instance){
		const button = event.target;
		const requestId = instance.$(button).data('requestId');
		const username = instance.$(button).data('username');
		const request = DayOffRequests.findOne({ _id: requestId });
		const user = Meteor.users.findOne({ username: username });

		let remindTime = moment(request.requestedDate[0]).subtract(DAYS_BEFORE_REQUEST_TO_SEND_REMINDER, 'days').startOf('day');

		Meteor.call('reminderEmails.scheduleReminder', request, user, remindTime.toDate(), (err) => {
			if(err){
				console.log(err.name, err.message);
				Session.set('errorAlert', 'There was a problem scheduling the reminder. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
				throwError(err.message);
			}
		});
	}
});
