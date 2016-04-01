import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { DayOffRequests } from '../api/day-off-requests.js';
import { Locations } from '../api/locations.js';

import './body.html';

Template.main.helpers({

});

const entries = [
	"dayOffType",
	"requestorName",
	"requestedDate",
	"requestedLocation"
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
	DayOffRequests.insert(request);
}

Template.home.helpers({
	entries: entries,
	getEntry(id){
		const entry = Session.get(id);

		if(id == "requestedLocation" && Session.get(id))
			return entry.name;
		return entry;
	}
});

Template.dayOffEntry.helpers({
	nextEntry(){
		for(let entry of entries){
			if(!Session.get(entry)){
				return entry;
			}
		}
		insertEntries();
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

		if(entries.indexOf(input.name) !== -1){
			let value;
			if(input.name == "requestedLocation")
				value = Locations.findOne(input.value);
			else
				value = input.value;

				Session.set(input.name, value);
		}
		else {
			alert("Unknown attribute name");
		}
	}
});

Template.dayOffType.helpers({
	dayOffButtons: [
		{ text: "Sick day", value: "sick" },
		{ text: "I-Day", value: "iDay" }
	]
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
