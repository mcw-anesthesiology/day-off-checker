import { Accounts } from 'meteor/accounts-base';
import { AccountsTemplates } from 'meteor/useraccounts:core';

Accounts.config({
	forbidClientAccountCreation: true
});

AccountsTemplates.configure({
	forbidClientAccountCreation: true,
	showForgotPasswordLink: true,
	enablePasswordChange: true,
	defaultLayoutType: 'blaze',
	defaultLayout: 'main',
	texts: {
		errors: {
			loginForbidden: 'Login failed',
			mustBeLoggedIn: 'Please login'
		}
	}
});

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

AccountsTemplates.configureRoute('forgotPwd', {
	layoutType: 'blaze',
	name: 'ForgotPassword',
	path: '/forgot-password',
	contentRegion: 'main'
});

AccountsTemplates.configureRoute('resetPwd', {
	layoutType: 'blaze',
	name: 'ResetPassword',
	path: '/reset-password',
	contentRegion: 'main'
});

AccountsTemplates.configureRoute('changePwd', {
	layoutType: 'blaze',
	name: 'ChangePassword',
	path: '/change-password',
	contentRegion: 'main'
});
