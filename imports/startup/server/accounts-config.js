import { Accounts } from 'meteor/accounts-base';

Accounts.onCreateUser((options, user) => {
	user.name = options.name;
	user.role = options.role;
	user.notify = options.notify;
	user.pager = options.pager;
	return user;
});
