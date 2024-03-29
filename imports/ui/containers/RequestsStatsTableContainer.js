import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { DayOffRequests } from '../../api/day-off-requests.js';
import RequestsStatsTable from '../components/RequestsStatsTable.js';

import { isValidDateRange, getRequestorTypeQuery } from '../../utils.js';

const RequestsStatsTableContainer = withTracker(props => {
	const requestsHandle = Meteor.subscribe('dayOffRequests');

	const {dates, requestDates} = props;
	const dateQuery = isValidDateRange(dates)
		? {
			'requestedDate.0': {
				$lte: dates[1]
			},
			'requestedDate.1': {
				$gte: dates[0]
			},
			requestTime: {
				$gte: requestDates[0],
				$lte: requestDates[1]
			}
		}
		: {};

	const query = Object.assign(getRequestorTypeQuery(), dateQuery);

	const dayOffRequests = requestsHandle.ready()
		? DayOffRequests.find(query).fetch()
		: [];

	return {
		...props,
		currentUser: Meteor.user(),
		dayOffRequests
	};
})(RequestsStatsTable);

export default RequestsStatsTableContainer;
