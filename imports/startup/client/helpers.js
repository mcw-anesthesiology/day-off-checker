import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import moment from 'moment';
import 'twix';

Template.registerHelper('displayDate', (date) => {
	if(!date)
		return "Invalid date";
	return moment(date).calendar();
});

Template.registerHelper('displayDateRange', (dates) => {
	if(!dates || dates.length < 2)
		return "Invalid date range";
	return moment(dates[0]).twix(dates[1], true).format();
});

Template.registerHelper('displayNameByUsername', (username) => {
	if(!username)
		return "";
	const user = Meteor.users.findOne({ username: username });
	return user.name;
});

Template.registerHelper('routeName', () => {
	return FlowRouter.getRouteName();
});

Template.registerHelper('routeIs', (routeName) => {
	return (FlowRouter.getRouteName() === routeName);
});
