import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import validator from 'email-validator';

import moment from 'moment';
import 'twix';

import 'bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';

import { ADMIN_EMAIL_ADDRESS } from '../../constants.js';

import './home.html';


const entries = [
	"dayOffType",
	"requestorName",
	"requestorEmail",
	"requestedDate",
	"requestedLocation",
	"requestReason"
];

const entryNames = {
	dayOffType: "Type",
	requestorName: "Name",
	requestorEmail: "Email",
	requestedDate: "Date",
	requestedLocation: "Location",
	requestReason: "Reason"
};

const dayOffTypeNames = {
	sick: "Sick day",
	iDay: "I-Day"
};

const dayOffButtons = [
	{ text: "Sick day", value: "sick" },
	{ text: "I-Day", value: "iDay" }
];


function insertEntries(){
	let request = {};
	for(let entry of entries){
		let value = Session.get(entry);
		if(!value){
			Session.set("errorAlert", "Please complete all entries");
			return;
		}
		request[entry] = value;
	}
	Meteor.call('dayOffRequests.insert', request, (err, res) => {
		if(err){
			console.log(err.name + ": " + err.message);
			Session.set("errorAlert", "Problem creating a request. Please refresh the page and try again. If this problem continues, please let me know at " + ADMIN_EMAIL_ADDRESS + ".");
		}
		else
			Session.set("submissionConfirmation", true);
	});
}

Template.home.helpers({
	entries: entries,
	currentUserAdmin(){
		return (Meteor.user().role === "admin");
	},
	dayOffType(){
		return Session.get("dayOffType");
	},
	editable(){
		if(!Session.equals("submissionConfirmation", true))
			return "editable";
	},
	getEntry(id){
		const entry = Session.get(id);

		if(entry){
			switch(id){
				case "dayOffType":
					return dayOffTypeNames[entry];
					break;
				case "requestedLocation":
					return entry.name;
					break;
				case "requestedDate":
					return moment(entry[0]).twix(entry[1], true).format();
					break;
				case "requestReason":
					return entry;
					break;
				default:
					return entry;
					break;
			}
		}
	},
	entryName(entry){
		return entryNames[entry];
	},
	hint(){
		return Session.get("hint");
	}
});

Template.home.events({
	'click .completed-entry.editable th, click .completed-entry.editable td'(event, instance) {
		const target = event.target;
		const parent = $(target).parent();
		const entry = parent.data('id');
		const oldValue = Session.get(entry);
		Session.set('old_' + entry, oldValue);
		Session.set(entry, undefined);
	}
});

Template.dayOffEntry.helpers({
	nextEntry(){
		for(let entry of entries){
			if(!Session.get(entry)){
				return entry;
			}
		}
		if(!Session.get("requestConfirmation"))
			return "requestConfirmation";
	}
});

Template.dayOffEntry.events({
	'click .day-off-button'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const button = event.target;

		if(["sick", "iDay"].indexOf(button.value) !== -1){
			Session.set("dayOffType", button.value);
		}
	},
	'submit .entry-form'(event, instance) {
		event.preventDefault();

		const form = event.target;
		const input = $(form).find("input, select, textarea")[0];

		let value;
		switch(input.name){
			case "dayOffType":
				if(["sick", "iDay"].indexOf(input.value) !== -1)
					value = input.value;
				else
					Session.set("errorAlert", "Unknown day off type");
				break;
			case "requestorName":
				if(input.value.trim() === "")
					Session.set("errorAlert", "Name looks empty. Please double check your name.");
				else
					value = input.value;
				break;
			case "requestorEmail":
				if(validator.validate(input.value))
					value = input.value;
				else
					Session.set("errorAlert", "Email address seems wrong. Please make sure to enter a valid email address.");
				break;
			case "requestedDate":
				let dates = input.value.split(" - ");
				let startDate = moment(dates[0], "MM/DD/YYYY");
				let endDate = moment(dates[1], "MM/DD/YYYY");
				let range = startDate.twix(endDate, true);
				if(!range.isValid())
					Session.set("errorAlert", "Invalid date range. Please select first the beginning date and then the ending date.");
				else if(range.isPast() || startDate.isBefore(moment().startOf("day")))
					Session.set("errorAlert", "You cannot request a day off for a date in the past.");
				else
					value = [ startDate.toDate(), endDate.toDate() ];
				break;
			case "requestedLocation":
				value = Locations.findOne(input.value);
				break;
			case "requestReason":
				value = input.value.trim();
				if(!value)
					value = "(None)";
				break;
			case "requestConfirmation":
				insertEntries();
				value = input.value;
				break;
			default:
				Session.set("errorAlert", "Unknown attribute name");
				break;
		}

		if(value){
			Session.set(input.name, value);
			Session.set("hint", undefined);
		}
	}
});

Template.dayOffType.helpers({
	dayOffButtons: dayOffButtons
});

Template.requestorName.onRendered(function(){
	this.$("#name").placeholder();
});

Template.requestorName.helpers({
	oldValue(){
		return Session.get('old_requestorName');
	}
})

Template.requestorEmail.onRendered(function(){
	this.$("#email").placeholder();
});

Template.requestorEmail.helpers({
	oldValue(){
		return Session.get('old_requestorEmail');
	}
});

Template.requestedDate.onRendered(function(){
	this.$("#daterange").placeholder();
	this.$("#daterange").daterangepicker({
		minDate: moment().startOf("day")
	});
	Session.set("hint", "Select a starting date and an ending date. If you are only missing one day, select the same day as both the starting and ending date.")
});

Template.requestedDate.helpers({
	oldValue(){
		if(Session.get('old_requestedDate')){
			const dates = Session.get('old_requestedDate');
			let range = moment(dates[0]).twix(dates[1], true);
			return range.simpleFormat("MM/DD/YYYY");
		}
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
		try{
			if(Session.get('old_requestedLocation')._id === location._id)
				return "selected";
		}
		catch(e){

		}
	}
});

Template.requestReason.onRendered(function(){
	this.$("#reason").placeholder();
});

Template.requestReason.helpers({
	oldValue(){
		let oldReason = Session.get("old_requestReason");
		if(oldReason != "(None)")
			return oldReason;
	}
});

Template.submissionConfirmation.onCreated(function(){
	Meteor.subscribe('chiefUserData');
});

Template.submissionConfirmation.helpers({
	sickDay(){
		return Session.get('dayOffType') === "sick";
	},
	location(){
		return Session.get('requestedLocation').name;
	},
	number(){
		return Session.get('requestedLocation').number;
	},
	chiefs(){
		return Meteor.users.find({ role: 'chief' }, { pager: 1, name: 1 });
	}
});

Template.submissionConfirmation.events({
	'click #restart'(event, instance){
		Session.set("submissionConfirmation", undefined);
		Session.set("requestConfirmation", undefined);
		for(let entry of entries){
			Session.set(entry, undefined);
		}
	}
})
