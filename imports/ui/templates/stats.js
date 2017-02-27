import { Template } from 'meteor/templating';

import RequestsStatsContainer from '../containers/RequestsStatsContainer.js';

import './stats.html';

Template.stats.helpers({
	RequestsStatsContainer: () => RequestsStatsContainer,
});
