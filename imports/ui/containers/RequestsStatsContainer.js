import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { DayOffRequests } from '../../api/day-off-requests.js';
import RequestsStats from '../components/RequestsStats.js';

const RequestsStatsContainer = createContainer(() => {
	Meteor.subscribe('dayOffRequests');
	const dayOffRequests = DayOffRequests.find().fetch() || [];

	return {
		dayOffRequests
	};
}, RequestsStats);

export default RequestsStatsContainer;
