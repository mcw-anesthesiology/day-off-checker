import { Accounts } from 'meteor/accounts-base';

Accounts.onCreateUser((options, user) => {
	user.name = options.name;
	user.role = options.role;
	user.notify = options.notify;
	user.pager = options.pager;
	return user;
});

Meteor.publish('chiefUserData', () => {
	return Meteor.users.find({ role: 'chief' }, { fields: {
		name: 1,
		role: 1,
		pager: 1
	}});
});

Meteor.publish('allUserData', () => {
	return Meteor.users.find({}, { fields: {
		_id: 1,
		username: 1,
		name: 1,
		role: 1,
		pager: 1,
		emails: 1
	}});
});
