import { Accounts } from 'meteor/accounts-base';

Accounts.onCreateUser((options, user) => {
	user.notify = options.notify;
	user.chief = options.chief;
	return user;
});
