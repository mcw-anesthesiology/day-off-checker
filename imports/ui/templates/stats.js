import { Template } from 'meteor/templating';

import RequestsStats from '../components/RequestsStats.js';

import './stats.html';

Template.stats.helpers({
	RequestsStats: () => RequestsStats,
});
