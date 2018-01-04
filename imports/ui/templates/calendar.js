import 'fullcalendar';
import 'fullcalendar/dist/fullcalendar.css';

import { DayOffRequests } from '../../api/day-off-requests.js';

import { getRequestorType, getRequestorTypeQuery } from '../../utils.js';
import {
	DAY_OFF_FIELDS,
	DAY_OFF_TYPES,
	DAY_OFF_TYPE_NAMES,
	DAY_OFF_TYPE_COLORS,
	SCREEN_BREAKPOINTS
} from '../../constants.js';

import debounce from 'lodash/debounce';
import moment from 'moment';

import './calendar.html';

let requestSubscription;
let dayOffEvents = [];
const calendarMobileHeight = 500;

Template.calendar.onCreated(function(){
	requestSubscription = this.subscribe('dayOffRequests');
	this.subscribe('allUserData');
});

Template.calendar.onRendered(function(){
	this.autorun(() => {
		if(requestSubscription.ready()){
			dayOffEvents = fetchDayOffEvents();
			this.$('#calendar').fullCalendar('removeEvents');
			this.$('#calendar').fullCalendar('addEventSource', dayOffEvents);
			this.$('#calendar').fullCalendar('render');
		}
	});

	const adjustCalendarHeight = (view = this.$('#calendar').fullCalendar('getView')) => {
		if(window.innerWidth < SCREEN_BREAKPOINTS.ON_DESKTOP){
			if(view.name === 'month')
				this.$('#calendar').fullCalendar('option', 'height', 'auto');
			else
				this.$('#calendar').fullCalendar('option', 'height', calendarMobileHeight);
		}
		else if(this.$('#calendar').fullCalendar('option', 'height'))
			this.$('#calendar').fullCalendar('option', 'height', 'null');
	};

	this.$('#calendar').fullCalendar({
		events: dayOffEvents,
		allDayDefault: true,
		displayEventTime: false,
		eventClick: showEventDetails,
		height: (window.innerWidth < SCREEN_BREAKPOINTS.ON_DESKTOP) ? calendarMobileHeight : null,
		defaultView: (window.innerWidth < SCREEN_BREAKPOINTS.ON_DESKTOP) ? 'listMonth' : 'month',
		header: {
			center: 'month listMonth'
		},
		viewRender: adjustCalendarHeight
	});

	window.addEventListener('resize', debounce(() => {
		adjustCalendarHeight();
	}, 100));
});

function showEventDetails(event){
	Session.set('eventDetails', event.id);
}

Template.calendar.helpers({
	eventDetails(){
		return DayOffRequests.findOne(Session.get('eventDetails'));
	},
	eventTypes: [
		'sick',
		'pending',
		'approved'
	]
});

Template.calendar.events({
	'click #close-event-details'(){
		Session.set('eventDetails', null);
	}
});

function fetchDayOffEvents(){
	const query = Object.assign(getRequestorTypeQuery(), {
		status: {
			$ne: 'denied'
		}
	});
	const requests = DayOffRequests.find(query);

	let events = requests.map(request => {
		let backgroundColor, borderColor;

		if(request.dayOffType === DAY_OFF_TYPES.SICK){
			backgroundColor = DAY_OFF_TYPE_COLORS[request[DAY_OFF_FIELDS.TYPE]].background;
			borderColor = DAY_OFF_TYPE_COLORS[request[DAY_OFF_FIELDS.TYPE]].border;
		}
		else {
			backgroundColor = DAY_OFF_TYPE_COLORS[request.status].background;
			borderColor = DAY_OFF_TYPE_COLORS[request.status].border;
		}

		return {
			id: request._id,
			title: `${request[DAY_OFF_FIELDS.NAME]} – ${DAY_OFF_TYPE_NAMES[request[DAY_OFF_FIELDS.TYPE]]}`,
			start: moment(request[DAY_OFF_FIELDS.DATE][0]).startOf('day'),
			end: moment(request[DAY_OFF_FIELDS.DATE][1]).add(1, 'day').startOf('day'),
			backgroundColor,
			borderColor
		};
	});

	return events;
}
