import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { DayOffRequests, getTypeConfirmers } from '../../api/day-off-requests.js';
import { isFellow, getRequestorType } from '../../utils.js';

import find from 'lodash/find';

import RequestDetails from '../components/RequestDetails.js';
import {
	DAY_OFF_FIELDS,
	DAY_OFF_TYPES,
	DAY_OFF_TYPE_NAMES
} from '../../constants.js';
import {
	displayDate,
	displayDateRange,
	capitalizeFirstLetter,
	getRequestorTypeQuery
} from '../../utils.js';

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
		const query = Object.assign(getRequestorTypeQuery(getRequestorType()), {
			[DAY_OFF_FIELDS.TYPE]: DAY_OFF_TYPES.SICK
		});
		const requests = DayOffRequests.find(
			query,
			{ sort: { createdAt: -1 } }
		);

		return requests && requests.count() > 0
			? requests
			: [{}];
	},
	sickDaySettings(){
		const settings = {
			fields: [
				{ key: 'requestorName', label: 'Name', sortOrder: 2, sortDirection: 'asc' },
				{ key: 'requestedLocation.name', label: 'Location' },
				{ key: 'requestedDate', label: 'Sick days', fn: displaySortableDateRange, sortOrder: 0, sortDirection: 'desc' },
				{ key: 'requestTime', label: 'Submitted', fn: displaySortableDate, sortOrder: 1, sortDirection: 'desc' },
				{ key: 'requestReason', label: 'Reason' }
			]
		};

		if (isFellow())
			settings.fields.splice(1, 0, {
				key: 'requestedFellowship.name',
				label: 'Fellowship'
			});

		return settings;
	},
	requestDetails(){
		return DayOffRequests.findOne(Session.get('iDayDetailsId'));
	},
	requestRequests() {
		const query = Object.assign(getRequestorTypeQuery(getRequestorType()), {
			[DAY_OFF_FIELDS.TYPE]: {
				$in: [
					DAY_OFF_TYPES.MEETING,
					DAY_OFF_TYPES.VACATION,
					DAY_OFF_TYPES.I_DAY
				]
			}
		});
		const requests = DayOffRequests.find(query, {
			sort: { createdAt: -1 }
		});

		return requests && requests.count() > 0
			? requests
			: [{}];
	},
	requestSettings() {
		switch (getRequestorType()) {
			case 'fellow':
				return {
					fields: [
						{ key: 'requestorName', label: 'Name', sortOrder: 2, sortDirection: 'asc' },
						{ key: 'requestedFellowship.name', label: 'Fellowship' },
						{ key: DAY_OFF_FIELDS.TYPE, label: 'Request Type', fn: displayTypeName },
						{ key: 'requestedLocation.name', label: 'Location' },
						{ key: 'requestedDate', label: 'Dates', fn: displaySortableDateRange, sortOrder: 0, sortDirection: 'desc' },
						{ key: 'requestTime', label: 'Requested', fn: displaySortableDate, sortOrder: 1, sortDirection: 'desc' },
						{ key: 'requestReason', label: 'Reason' },
						{ key: 'status', label: 'Status', fn: capitalizeFirstLetter },
						{ key: 'confirmationRequests', label: '', fn: requestNeedsResponse }
					]
				};
			case 'intern':
			case 'resident':
			default:
				return {
					fields: [
						{ key: 'requestorName', label: 'Name', sortOrder: 2, sortDirection: 'asc' },
						{ key: 'requestedLocation.name', label: 'Location' },
						{ key: 'requestedDate', label: `${DAY_OFF_TYPE_NAMES[DAY_OFF_TYPES.I_DAY]}s`, fn: displaySortableDateRange, sortOrder: 0, sortDirection: 'desc' },
						{ key: 'requestTime', label: 'Requested', fn: displaySortableDate, sortOrder: 1, sortDirection: 'desc' },
						{ key: 'requestReason', label: 'Reason' },
						{ key: 'status', label: 'Status', fn: capitalizeFirstLetter },
						{ key: 'confirmationRequests', label: '', fn: requestNeedsResponse }
					]
				};
		}
	},
	RequestDetails(){
		return RequestDetails;
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
	'click .sick-day-requests tr'(){
		Session.set('sickDayDetailsId', this._id);
	},
	'click #close-i-day-details'(){
		Session.set('iDayDetailsId', undefined);
	},
	'click .i-day-requests tr'(){
		Session.set('iDayDetailsId', this._id);
	},
	'click #transfer-requests'() {
		if (Meteor.user().role !== 'admin')
			return;

		const requestorType = getRequestorType();
		Meteor.call('dayOffRequests.updateConfirmers', requestorType, err => {
			if (err) {
				console.error(err);
				Session.set('errorAlert', 'There was a problem transferring the requests to the new confirmers.');
			}
		});
	}
});

Template.singleRequestPage.onCreated(function(){
	Meteor.subscribe('dayOffRequests_byId', FlowRouter.getParam('_id'));
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
	},
	RequestDetails(){
		return RequestDetails;
	}
});
