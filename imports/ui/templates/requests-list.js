import { DayOffRequests } from '../../api/day-off-requests.js';
import { Locations } from '../../api/locations.js';

import './requests-list.html';

Template.requestsList.onCreated(function(){
	Meteor.subscribe('dayOffRequests');
});

Template.requestsList.helpers({
	requests(){
		return DayOffRequests.find({}, { sort: { createdAt: -1 } });
	}
});
