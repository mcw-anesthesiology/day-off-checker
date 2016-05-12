import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';


import { displayDate, displayDateRange, displayNameByUsername, nl2br, capitalizeFirstLetter } from '../../utils.js';

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
