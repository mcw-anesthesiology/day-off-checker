import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { Spacebars } from 'meteor/spacebars';

import { throwError } from 'meteor/saucecode:rollbar';

import { Fellowships } from '../../api/fellowships.js';
import { Locations } from '../../api/locations.js';

import { displayNameByUsername } from '../../utils.js';

import validator from 'email-validator';

import moment from 'moment';
import 'twix';

import 'flatpickr';
import 'flatpickr/dist/flatpickr.css';

import ManageRequest from '../components/ManageRequest.js';

import {
	ADMIN_EMAIL_ADDRESS,
	DAY_OFF_TYPE_NAMES,
	RESIDENT_DAY_OFF_TYPES,
	FELLOW_DAY_OFF_TYPES,
	DAY_OFF_FIELDS,
	DAY_OFF_FIELD_NAMES,
	DAY_OFF_TYPES,
	ISO_DATE_FORMAT
} from '../../constants.js';
import { isFellow, capitalizeFirstLetter, camelCaseToWords } from '../../utils.js';

import './home.html';

let fields = Object.values(DAY_OFF_FIELDS).filter(field => {
	if([
		DAY_OFF_FIELDS.FELLOWSHIP,
		DAY_OFF_FIELDS.ADDITIONAL_FELLOWSHIP_INFO
	].includes(field)){
		return isFellow();
	}

	return true;
});

function insertEntries(){
	let request = {};
	for(let field of fields){
		let value = Session.get(field);
		if(!value && fieldShouldBeCompleted(field)){
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
				case DAY_OFF_FIELDS.ADDITIONAL_FELLOWSHIP_INFO: {
					let fieldValue = '';
					for(let name of Object.keys(field)){
						let value = field[name];
						if(typeof value === 'boolean')
							value = value ? 'yes' : 'no';

						fieldValue += `${camelCaseToWords(name)}:
							${capitalizeFirstLetter(value)}<br />
						`;
					}
					return Spacebars.SafeString(fieldValue);
				}
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
			if(!Session.get(field) && fieldShouldBeCompleted(field)){
				return field;
			}
		}
		if(!Session.get('requestConfirmation'))
			return 'requestConfirmation';
	}
});

function fieldShouldBeCompleted(field){
	if(isFellow()){
		if([
			DAY_OFF_FIELDS.TYPE,
			DAY_OFF_FIELDS.NAME,
			DAY_OFF_FIELDS.EMAIL,
			DAY_OFF_FIELDS.DATE,
			DAY_OFF_FIELDS.FELLOWSHIP,
			DAY_OFF_FIELDS.LOCATION,
			DAY_OFF_FIELDS.REASON
		].includes(field))
			return true;

		if(field === DAY_OFF_FIELDS.ADDITIONAL_FELLOWSHIP_INFO){
			if([
				DAY_OFF_TYPES.SICK,
				DAY_OFF_TYPES.MEETING
			].includes(Session.get(DAY_OFF_FIELDS.TYPE)))
				return true;
		}
	}
	else {
		if([
			DAY_OFF_FIELDS.TYPE,
			DAY_OFF_FIELDS.NAME,
			DAY_OFF_FIELDS.EMAIL,
			DAY_OFF_FIELDS.DATE,
			DAY_OFF_FIELDS.LOCATION,
			DAY_OFF_FIELDS.REASON
		].includes(field))
			return true;
	}

	return false;
}

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
					startDate = moment(input.value, ISO_DATE_FORMAT);

					if(isRange){
						let endInput = instance.$(instance.$(input).data('endDateElement'))[0];
						endDate = moment(endInput.value, ISO_DATE_FORMAT);
					}
					else {
						endDate = moment(startDate);
					}
				}
				else {
					if(isRange){
						[startDate, endDate] = instance.$(input).val().split('to').map(date =>
							moment(date, ISO_DATE_FORMAT)
						);
					}
					else {
						startDate = moment(instance.$(input).val(), ISO_DATE_FORMAT);
						endDate = moment(startDate);
					}
				}
				let range = startDate.twix(endDate, true);
				if(!range.isValid())
					Session.set('errorAlert', 'Invalid date range. Please select first the beginning date and then the ending date.');
				else
					value = [ startDate.toDate(), endDate.toDate() ];
				break;
			}
			case DAY_OFF_FIELDS.FELLOWSHIP:
				value = Fellowships.findOne(input.value);
				break;
			case DAY_OFF_FIELDS.LOCATION:
				if(isFellow() && input.value === 'other'){
					let otherName = $(form).find('#other-location').val();
					value = {
						_id: 'other',
						name: otherName
					};
				}
				else if(isFellow() && input.value === 'not-assigned-yet'){
					value = {
						_id: 'not-assigned-yet',
						name: 'Not assigned yet'
					};
				}
				else {
					value = Locations.findOne(input.value);
				}
				break;
			case DAY_OFF_FIELDS.REASON:
				value = input.value.trim();
				if(!value)
					value = '(None)';
				break;
			case DAY_OFF_FIELDS.ADDITIONAL_FELLOWSHIP_INFO:
				// Handled in template
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
	},
	ManageRequest(){
		return ManageRequest;
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
		this.$('#daterange').flatpickr({
			mode: 'range'
		});
	else
		this.$('#daterange').flatpickr();
});

Template.requestedDate.helpers({
	isRange(){
		return Session.get('isRange');
	},
	oldValue(){
		if(Session.get(`old_${DAY_OFF_FIELDS.DATE}`)){
			const dates = Session.get(`old_${DAY_OFF_FIELDS.DATE}`);
			return dates.map(date => moment(date).format(ISO_DATE_FORMAT))
				.join(' to ');
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
			instance.$('#daterange').flatpickr({
				mode: 'range'
			});
			instance.$('label[for="start-date"]').text('Start date');
		}
		else {
			instance.$('#daterange').flatpickr();
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
	if(isFellow()){
		this.otherSelected = new ReactiveVar();
		this.otherSelected.set(false);
	}
});

Template.requestedLocation.helpers({
	locations(){
		let queryObject = {
			fellowship: { $exists: false }
		};
		if(isFellow()){
			if(Session.get(DAY_OFF_FIELDS.FELLOWSHIP)){
				queryObject = {
					fellowship: Session.get(DAY_OFF_FIELDS.FELLOWSHIP)._id
				};
			}
			else {
				Session.set('errorAlert', 'Please select a fellowship');
				return;
			}
		}
		return Locations.find(queryObject, { sort: { name: 1 } });
	},
	isRequest(){
		return !Session.equals(DAY_OFF_FIELDS.TYPE, DAY_OFF_TYPES.SICK);
	},
	oldValueSelected(location){
		const oldLocation = Session.get(`old_${DAY_OFF_FIELDS.LOCATION}`);
		if(oldLocation && oldLocation._id === location._id)
			return 'selected';
	},
	otherSelected(){
		return Template.instance().otherSelected.get();
	}
});

Template.requestedLocation.events({
	'change #location'(event, instance){
		if(isFellow()){
			instance.otherSelected.set(event.target.value === 'other');
		}
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

Template.additionalFellowshipInfo.onCreated(function(){
	this.state = new ReactiveDict();
});

Template.additionalFellowshipInfo.helpers({
	DAY_OFF_TYPES: DAY_OFF_TYPES,
	submissionType(type){
		return Session.equals(DAY_OFF_FIELDS.TYPE, type);
	},
	alreadyNotified(){
		return Template.instance().state.get('alreadyNotified');
	}
});

Template.additionalFellowshipInfo.events({
	'change .additional-fellowship-info, input .additional-fellowship-info'(event, instance){
		let value;
		switch(event.target.name){
			case 'alreadyNotified':
			case 'presenting':
			case 'cancelRequest':
				value = (event.target.value === 'yes');
				break;
			default:
				value = event.target.value;
				break;
		}
		instance.state.set(event.target.name, value);
	},
	'click #submit-additional-fellowship-info, keypress'(event, instance){
		if(event.type === 'keypress'){
			if(event.which === 13){ // Enter key
				event.preventDefault();
				event.stopImmediatePropagation();
			}
			else {
				return;
			}
		}

		switch(Session.get(DAY_OFF_FIELDS.TYPE)){
			case DAY_OFF_TYPES.SICK:
				instance.state.set('alreadyNotified', Boolean(instance.state.get('alreadyNotified')));
				if(instance.state.get('alreadyNotified')){
					if(!instance.state.get('notified')){
						Session.set('errorAlert', 'Please say who you notified.');
						return;
					}
				}
				break;
			case DAY_OFF_TYPES.MEETING:
				instance.state.set('presenting', Boolean(instance.state.get('presenting')));
				break;
			case DAY_OFF_TYPES.VACATION:
				break;
			default:
				Session.set('errorAlert', 'Unrecognized info');
				break;
		}
		Session.set(DAY_OFF_FIELDS.ADDITIONAL_FELLOWSHIP_INFO, instance.state.all());
	}
});
