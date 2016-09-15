import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { throwError } from 'meteor/saucecode:rollbar';

import { Fellowships } from '../../api/fellowships.js';
import { Locations } from '../../api/locations.js';

import { displayNameByUsername } from '../../utils.js';

import validator from 'email-validator';

import moment from 'moment';
import 'twix';

import 'bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';

import {
	ADMIN_EMAIL_ADDRESS,
	DAY_OFF_TYPE_NAMES,
	RESIDENT_DAY_OFF_TYPES,
	FELLOW_DAY_OFF_TYPES,
	DAY_OFF_FIELDS,
	DAY_OFF_FIELD_NAMES,
	ISO_DATE_FORMAT
} from '../../constants.js';
import { isFellow } from '../../utils.js';

import './home.html';

let fields = Object.values(DAY_OFF_FIELDS).filter(field => {
	if(field === DAY_OFF_FIELDS.FELLOWSHIP){
		return isFellow();
	}

	return true;
});

function insertEntries(){
	let request = {};
	for(let field of fields){
		let value = Session.get(field);
		if(!value){
			Session.set('errorAlert', 'Please complete all fields');
			return;
		}
		request[field] = value;
	}

	Meteor.call('dayOffRequests.insert', request, (err) => {
		if(err){
			console.log(err.name + ': ' + err.message);
			Session.set('errorAlert', 'Problem creating a request. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
			throwError(err.message);
		}
		else
			Session.set('submissionConfirmation', true);
	});
}

Template.home.helpers({
	fields: fields,
	currentUserAdmin(){
		return (Meteor.user().role === 'admin');
	},
	dayOffType(){
		return Session.get('dayOffType');
	},
	editable(){
		if(!Session.equals('submissionConfirmation', true))
			return 'editable';
	},
	getField(id){
		const field = Session.get(id);

		if(field){
			switch(id){
				case DAY_OFF_FIELDS.TYPE:
					return DAY_OFF_TYPE_NAMES[field];
				case DAY_OFF_FIELDS.FELLOWSHIP:
				case DAY_OFF_FIELDS.LOCATION:
					return field.name;
				case DAY_OFF_FIELDS.DATE:
					return moment(field[0]).twix(field[1], true).format();
				case DAY_OFF_FIELDS.REASON:
					return field;
				default:
					return field;
			}
		}
	},
	fieldName(field){
		return DAY_OFF_FIELD_NAMES[field];
	}
});

Template.home.events({
	'click .completed-entry.editable th, click .completed-entry.editable td'(event) {
		const target = event.target;
		const parent = $(target).parent();
		const field = parent.data('id');
		const oldValue = Session.get(field);
		Session.set('old_' + field, oldValue);
		Session.set(field, undefined);
	}
});

Template.dayOffEntry.helpers({
	nextField(){
		for(let field of fields){
			if(!Session.get(field)){
				return field;
			}
		}
		if(!Session.get('requestConfirmation'))
			return 'requestConfirmation';
	}
});

Template.dayOffEntry.events({
	'click .day-off-button'(event) {
		event.preventDefault();
		event.stopPropagation();

		const button = event.target;

		const allowedTypes = isFellow() ? FELLOW_DAY_OFF_TYPES : RESIDENT_DAY_OFF_TYPES;

		if(allowedTypes.indexOf(button.value) !== -1){
			Session.set(DAY_OFF_FIELDS.TYPE, button.value);
		}
	},
	'submit .entry-form'(event, instance) {
		event.preventDefault();

		const form = event.target;
		const input = $(form).find('input[type="hidden"], input:visible, select, textarea')[0];

		let value;
		switch(input.name){
			case DAY_OFF_FIELDS.TYPE: {
				const allowedTypes = isFellow() ? FELLOW_DAY_OFF_TYPES : RESIDENT_DAY_OFF_TYPES;
				if(allowedTypes.indexOf(input.value) !== -1)
					value = input.value;
				else
					Session.set('errorAlert', 'Unknown day off type');
				break;
			}
			case DAY_OFF_FIELDS.NAME:
				if(input.value.trim() === '')
					Session.set('errorAlert', 'Name looks empty. Please double check your name.');
				else
					value = input.value;
				break;
			case DAY_OFF_FIELDS.EMAIL:
				if(validator.validate(input.value))
					value = input.value;
				else
					Session.set('errorAlert', 'Email address seems wrong. Please make sure to enter a valid email address.');
				break;
			case DAY_OFF_FIELDS.DATE: {
				let isRange = instance.$('#multiple-days').prop('checked');
				let startDate, endDate;
				if(instance.$(input).data('endDateElement')){
					startDate = moment(input.value, 'YYYY-MM-DD');

					if(isRange){
						let endInput = instance.$(instance.$(input).data('endDateElement'))[0];
						endDate = moment(endInput.value, 'YYYY-MM-DD');
					}
					else {
						endDate = moment(startDate);
					}
				}
				else {
					if(isRange){
						let dates = input.value.split(' - ');
						startDate = moment(dates[0], 'MM/DD/YYYY');
						endDate = moment(dates[1], 'MM/DD/YYYY');
					}
					else {
						startDate = moment(input.value, 'MM/DD/YYYY');
						endDate = moment(startDate);
					}
				}
				let range = startDate.twix(endDate, true);
				if(!range.isValid())
					Session.set('errorAlert', 'Invalid date range. Please select first the beginning date and then the ending date.');
				else if(range.isPast() || startDate.isBefore(moment().startOf('day')))
					Session.set('errorAlert', 'You cannot request a day off for a date in the past.');
				else
					value = [ startDate.toDate(), endDate.toDate() ];
				break;
			}
			case DAY_OFF_FIELDS.FELLOWSHIP:
				value = Fellowships.findOne(input.value);
				break;
			case DAY_OFF_FIELDS.LOCATION:
				value = Locations.findOne(input.value);
				break;
			case DAY_OFF_FIELDS.REASON:
				value = input.value.trim();
				if(!value)
					value = '(None)';
				break;
			case 'requestConfirmation':
				insertEntries();
				value = input.value;
				break;
			default:
				Session.set('errorAlert', 'Unknown attribute name');
				break;
		}

		if(value){
			Session.set(input.name, value);
		}
	}
});

Template.dayOffType.helpers({
	dayOffButtons(){
		let buttons = [];
		const types = isFellow() ? FELLOW_DAY_OFF_TYPES : RESIDENT_DAY_OFF_TYPES;
		for(let type of types){
			let button = {
				value: type,
				text: DAY_OFF_TYPE_NAMES[type]
			};
			buttons.push(button);
		}

		return buttons;
	}
});

Template.requestorName.onRendered(function(){
	this.$('#name').placeholder();
	this.$('#name').focus();
});

Template.requestorName.helpers({
	oldValue(){
		return Session.get(`old_${DAY_OFF_FIELDS.NAME}`);
	}
});

Template.requestorEmail.onRendered(function(){
	this.$('#email').placeholder();
	this.$('#email').focus();
});

Template.requestorEmail.helpers({
	oldValue(){
		return Session.get(`old_${DAY_OFF_FIELDS.EMAIL}`);
	}
});

Template.requestedDate.onRendered(function(){
	this.$('#daterange').placeholder();

	if(Session.get('isRange'))
		this.$('#daterange').daterangepicker({
			minDate: moment().startOf('day')
		});
	else
		this.$('#daterange').daterangepicker({
			singleDatePicker: true,
			minDate: moment().startOf('day')
		});
});

Template.requestedDate.helpers({
	isRange(){
		return Session.get('isRange');
	},
	oldValue(){
		if(Session.get(`old_${DAY_OFF_FIELDS.DATE}`)){
			const dates = Session.get(`old_${DAY_OFF_FIELDS.DATE}`);
			let range = moment(dates[0]).twix(dates[1], true);
			return range.simpleFormat('MM/DD/YYYY');
		}
	},
	oldStartValue(){
		if(Session.get(`old_${DAY_OFF_FIELDS.DATE}`)){
			const dates = Session.get(`old_${DAY_OFF_FIELDS.DATE}`);
			let startDate = moment(dates[0]);
			return startDate.format(ISO_DATE_FORMAT);
		}
	},
	oldEndValue(){
		if(Session.get(`old_${DAY_OFF_FIELDS.DATE}`)){
			const dates = Session.get(`old_${DAY_OFF_FIELDS.DATE}`);
			let startDate = moment(dates[1]);
			return startDate.format(ISO_DATE_FORMAT);
		}
	},
	oldMultiple(){
		if(Session.get('isRange'))
			return 'checked';
	},
	today(){
		return moment().format(ISO_DATE_FORMAT);
	},
	startDate(){
		let startDate = Session.get('startDate');
		if(!startDate)
			return moment().format(ISO_DATE_FORMAT);

		return startDate;
	}
});

Template.requestedDate.events({
	'change #multiple-days'(event, instance){
		let checkbox = event.target;
		Session.set('isRange', checkbox.checked);
		if(checkbox.checked){
			instance.$('#daterange').daterangepicker({
				minDate: moment().startOf('day')
			});
			instance.$('label[for="start-date"]').text('Start date');
		}
		else {
			instance.$('#daterange').daterangepicker({
				singleDatePicker: true,
				minDate: moment().startOf('day')
			});
			instance.$('label[for="start-date"]').text('Date');
		}
	},
	'input #start-date'(event){
		Session.set('startDate', event.target.value);
	}
});

Template.requestedFellowship.onCreated(function(){
	Meteor.subscribe('fellowships');
});

Template.requestedFellowship.helpers({
	fellowships(){
		return Fellowships.find({}, { sort: { name: 1 } });
	},
	oldValueSelected(fellowship){
		const oldFellowship = Session.get(`old_${DAY_OFF_FIELDS.FELLOWSHIP}`);
		if(oldFellowship && oldFellowship._id === fellowship._id)
			return 'selected';
	}
});

Template.requestedLocation.onCreated(function(){
	Meteor.subscribe('locations');
});

Template.requestedLocation.helpers({
	locations(){
		return Locations.find({}, { sort: { name: 1 } });
	},
	oldValueSelected(location){
		const oldLocation = Session.get(`old_${DAY_OFF_FIELDS.LOCATION}`);
		if(oldLocation && oldLocation._id === location._id)
			return 'selected';
	}
});

Template.requestReason.onRendered(function(){
	this.$('#reason').placeholder();
	this.$('#reason').focus();
});

Template.requestReason.helpers({
	oldValue(){
		let oldReason = Session.get(`old_${DAY_OFF_FIELDS.REASON}`);
		if(oldReason !== '(None)')
			return oldReason;
	}
});

Template.submissionConfirmation.onCreated(function(){
	Meteor.subscribe('chiefUserData');
});

Template.submissionConfirmation.helpers({
	sickDay(){
		return Session.get(DAY_OFF_FIELDS.TYPE) === 'sick';
	},
	location(){
		return Session.get(DAY_OFF_FIELDS.LOCATION).name;
	},
	number(){
		return Session.get(DAY_OFF_FIELDS.LOCATION).number;
	},
	chiefs(){
		return Meteor.users.find({ role: 'chief' }, { pager: 1, name: 1 });
	},
	fellowshipAdminName(){
		const username = Session.get(DAY_OFF_FIELDS.FELLOWSHIP).administrator;
		return displayNameByUsername(username);
	}
});

Template.submissionConfirmation.events({
	'click #restart'(){
		Session.set('submissionConfirmation', undefined);
		Session.set('requestConfirmation', undefined);
		for(let field of fields){
			Session.set(field, undefined);
		}
	}
});
