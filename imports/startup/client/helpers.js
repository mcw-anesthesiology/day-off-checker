import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import moment from 'moment';

moment.updateLocale('en', {
	calendar: {
		lastDay: "[Yesterday], L",
		sameDay: "[Today], L",
		nextDay: "[Tomorrow], L",
		lastWeek: "[Last] dddd, L",
		nextWeek: "[Next] dddd, L",
		sameElse: "L"
	}
});

Template.registerHelper('displayDate', (date) => {
	if(!date)
		return "";
	return moment(date).calendar();
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
