import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';


import {
	displayDate,
	displayDateRange,
	displayNameByUsername,
	nl2br,
	capitalizeFirstLetter,
	camelCaseToWords,
	getRequestorType,
	isRequestorType,
	isFellow
} from '../../utils.js';

Template.registerHelper('currentUserAdmin', () => {
	return (Meteor.user().role === 'admin');
});

Template.registerHelper('displayDate', displayDate);
Template.registerHelper('displayDateRange', displayDateRange);
Template.registerHelper('displayNameByUsername', displayNameByUsername);

Template.registerHelper('routeName', () => {
	return FlowRouter.getRouteName();
});

Template.registerHelper('routeIs', (routeName) => {
	return (FlowRouter.getRouteName() === routeName);
});

Template.registerHelper('nl2br', nl2br);
Template.registerHelper('capitalizeFirstLetter', capitalizeFirstLetter);
Template.registerHelper('camelCaseToWords', camelCaseToWords);
Template.registerHelper('getRequestorType', getRequestorType);
Template.registerHelper('isRequestorType', isRequestorType);
Template.registerHelper('isFellow', isFellow);
Template.registerHelper('userEmail', user => {
	console.log(user.emails);
	return (
		user
		&& user.emails
		&& Array.isArray(user.emails)
		&& user.emails[0]
	)
		? user.emails[0].address
		: '';
});
