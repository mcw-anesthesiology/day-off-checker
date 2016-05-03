import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import moment from 'moment';

import './home.html';

// TODO: ReactiveVar/Dict instead of Session?


const entries = [
	"dayOffType",
	"requestorName",
	"requestorEmail",
	"requestedDate",
	"requestedLocation"
];

const entryNames = {
	dayOffType: "Type",
	requestorName: "Name",
	requestorEmail: "Email",
	requestedDate: "Date",
	requestedLocation: "Location"
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
			alert("Please complete all entries"); // TODO: Replace alerts with something better
			return;
		}
		request[entry] = value;
	}
	Meteor.call('dayOffRequests.insert', request, (err, res) => {
		if(err)
			alert(err); // FIXME
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
					return moment(entry).calendar();
					break;
				default:
					return entry;
					break;
			}
		}
	},
	entryName(entry){
		return entryNames[entry];
	}
});

Template.home.events({
	'click .completed-entry.editable th, click .completed-entry.editable td'(event, instance) {
		// TODO: Fill input with old value
		const target = event.target;
		const parent = $(target).parent();
		const entry = parent.data('id');
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
		const input = $(form).find("input, select")[0];

		let value;
		switch(input.name){
			case "dayOffType":
				if(["sick", "iDay"].indexOf(input.value) !== -1)
					value = input.value;
				else
					alert("Unknown day off type");
				break;
			case "requestorName":
				// TODO: Validation
				value = input.value;
				break;
			case "requestorEmail":
				// TODO: Validation
				value = input.value;
				break;
			case "requestedDate":
				let time = moment(input.value, "YYYY-MM-DD");
				if(!time.isValid())
					alert("Invalid date. Please make sure it is formatted correctly (YYYY-MM-DD).");
				else if(time.isBefore(moment().startOf("day")))
					alert("You cannot request a day off for a date in the past.");
				else
					value = time.toDate();
				break;
			case "requestedLocation":
				value = Locations.findOne(input.value);
				break;
			case "requestConfirmation":
				insertEntries();
				value = input.value;
				break;
			default:
				alert("Unknown attribute name");
				break;
		}

		if(value)
			Session.set(input.name, value);
	}
});

Template.dayOffType.helpers({
	dayOffButtons: dayOffButtons
});

Template.requestorName.onRendered(() => {
	$("#name").placeholder();
});

Template.requestorEmail.onRendered(() => {
	$("#email").placeholder();
});

Template.requestedDate.onRendered(() => {
	$("#date").placeholder(); // FIXME: Not a date for sick day? Next day only?
});

Template.requestedLocation.onCreated(function(){
	Meteor.subscribe('locations');
});

Template.requestedLocation.helpers({
	locations(){
		return Locations.find({}, { sort: { name: 1 } });
	}
});

Template.submissionConfirmation.onCreated(() => {
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
