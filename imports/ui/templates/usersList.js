import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { throwError } from 'meteor/saucecode:rollbar';

import '../../api/users.js';

import { userHasPermission } from '../../utils.js';
import {
	ADMIN_EMAIL_ADDRESS,
	USER_ROLE_NAMES,
	USER_PERMISSION_NAMES
} from '../../constants.js';

import './usersList.html';

Template.usersList.onCreated(() => {
	Meteor.subscribe('allUserData');
	Session.set('userToEdit', undefined);
});

Template.usersList.helpers({
	users() {
		return Meteor.users.find({});
	},
	usersSettings() {
		return {
			fields: [
				{ key: 'name', label: 'Name', sortOrder: 1 },
				{ key: 'username', label: 'Username' },
				{ key: 'emails', label: 'Email', fn: getFirstEmail },
				{ key: 'role', label: 'Role', sortOrder: 0, fn: roleName },
				{ key: 'pager', label: 'Pager' },
				{ key: 'phone', label: 'Phone' }
			],
			rowClass: user => user.role
		};
	},
	userToEdit() {
		return Session.get('userToEdit');
	}
});

Template.usersList.events({
	'click #add-user'() {
		Session.set('userToEdit', {});
	},
	'click .reactive-table tbody tr'(event) {
		event.preventDefault();
		const user = this;
		Session.set('userToEdit', user);
	}
});

function getFirstEmail(emails) {
	if (emails && emails.length > 0)
		return emails[0].address;
}

function roleName(role) {
	return USER_ROLE_NAMES[role];
}

Template.editUser.helpers({
	editing(user) {
		return user._id;
	},
	getFirstEmail: getFirstEmail,
	roles() {
		let roles = [];
		for (let role in USER_ROLE_NAMES) {
			roles.push({ id: role, name: USER_ROLE_NAMES[role] });
		}
		return roles;
	},
	isSelected(user, role) {
		if (user.role === role)
			return 'selected';
	},
	userIsChief(user) {
		return user.role === 'chief';
	},
	userHasPermission,
	permissions() {
		return Array.from(Object.keys(USER_PERMISSION_NAMES));
	},
	permissionName(permission) {
		return USER_PERMISSION_NAMES[permission];
	}
});

Template.editUser.events({
	'click .close-edit-user'() {
		Session.set('userToEdit', undefined);
	},
	'change #role'(event) {
		let user = Session.get('userToEdit');
		user.role = event.target.value;
		Session.set('userToEdit', user);
	},
	'click #resend-enrollment-email'() {
		const userId = Session.get('userToEdit')._id;
		Meteor.call('resendEnrollmentEmail', userId, (err) => {
			if (err) {
				console.log(err.name + ': ' + err.message);
				Session.set('errorAlert', 'There was a problem resending the enrollment email. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
				throwError(err.message);
			}
			else
				Session.set('userToEdit', undefined);
		});
	},
	'submit #edit-user'(event) {
		event.preventDefault();
		const form = event.target;
		const formArray = $(form).serializeArray();
		const userId = Session.get('userToEdit')._id;
		const arrayProps = ['permissions'];
		const booleanProps = ['inactive'];
		let user = {};
		for (let {name, value} of formArray) {
			if (arrayProps.includes(name)) {
				if (!user[name] || !Array.isArray(user[name]))
					user[name] = [];
				user[name].push(value);
			} else if(booleanProps.includes(name)) {
				user[name] = Boolean(value);
			} else {
				user[name] = value;
			}
		}

		for (const booleanProp of booleanProps) {
			if (!(booleanProp in user)) {
				user[booleanProp] = false;
			}
		}

		if (userId)
			Meteor.call('updateUser', userId, user, (err) => {
				if (err) {
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem updating the user. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
					throwError(err.message);
				} else {
					Session.set('userToEdit', undefined);
				}
			});
		else
			Meteor.call('addUser', user, (err) => {
				if (err) {
					console.log(err.name + ': ' + err.message);
					Session.set('errorAlert', 'There was a problem adding the user. Please refresh the page and try again. If this problem continues, please let me know at ' + ADMIN_EMAIL_ADDRESS + '.');
					throwError(err.message);
				} else {
					Session.set('userToEdit', undefined);
				}
			});
	}
});
