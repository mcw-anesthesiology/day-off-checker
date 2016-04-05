import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import './requests-list.html';
import './sick-day-request.js';
import './i-day-request.js';

Template.requestsList.onCreated(function(){
	Meteor.subscribe('dayOffRequests');
});

Template.requestsList.helpers({
	sickDayRequests(){
		return DayOffRequests.find({ dayOffType: "sick" }, { sort: { createdAt: -1 } });
	},
	iDayRequests(){
		return DayOffRequests.find({ dayOffType: "iDay" }, { sort: { createdAt: -1 } });
	}
});
