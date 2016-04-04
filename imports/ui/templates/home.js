import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import moment from 'moment';

import './home.html';


const entries = [
	"dayOffType",
	"requestorName",
	"requestedDate",
	"requestedLocation"
];

const entryNames = {
	dayOffType: "Type",
	requestorName: "Name",
	requestedDate: "Date",
	requestedLocation: "Location"
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
			alert("Please complete all entries");
			return;
		}
		request[entry] = value;
	}
	Meteor.call('dayOffRequests.insert', request, (err, res) => {
		if(err)
			alert(err);
	});
}

Template.home.helpers({
	entries: entries,
	getEntry(id){
		const entry = Session.get(id);

		if(entry){
			switch(id){
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
	'click .completed-entry'(event, instance) {
		event.preventDefault();
		const target = event.target;
		const entry = target.dataset.id;
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
		if(!Session.get("confirmation"))
			return "confirmation";

		return "numberToCall";
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
		const input = form.children[0];

		let value;
		switch(input.name){
			case "dayOffType":
				if(["sick", "iDay"].indexOf(input.value) !== -1)
				break;
			case "requestorName":
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
			case "confirmation":
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

Template.requestedLocation.onCreated(function(){
	Meteor.subscribe('locations');
});

Template.requestedLocation.helpers({
	locations(){
		return Locations.find({}, { sort: { name: 1 } });
	}
});

Template.numberToCall.helpers({
	number(){
		const location = Session.get("requestedLocation");
		return Locations.findOne(location).number;
	}
});
