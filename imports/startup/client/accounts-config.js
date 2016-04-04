import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { FlowRouter } from 'meteor/kadira:flow-router';

Accounts.config({
	forbidClientAccountCreation: true
});

AccountsTemplates.configure({
	forbidClientAccountCreation: true,
	defaultLayoutType: 'blaze',
	defaultLayout: 'main'
});

AccountsTemplates.removeField('email');
const pwd = AccountsTemplates.removeField('password');
AccountsTemplates.addFields([
	{
		_id: 'username',
		type: 'text',
		displayName: 'Username',
		required: true
	},
	pwd
]);


AccountsTemplates.configureRoute('signIn', {
	layoutType: 'blaze',
	name: 'signin',
	path: '/login',
	contentRegion: 'main'
});
