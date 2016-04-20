import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const userSchema = new SimpleSchema({
	name: {
		type: String,
		label: "Name"
	},
	username: {
		type: String,
		label: "Username"
	},
	email: {
		type: String,
		label: "Email",
		regEx: SimpleSchema.RegEx.Email
	},
	role: {
		type: String,
		label: "Role",
		allowedValues: [
			"chief",
			"admin",
			"location_admin"
		]
	},
	pager: {
		type: String,
		label: "Pager",
		optional: true
	}
});

Meteor.methods({
	'addUser'(user){
		if(Meteor.user().role !== "admin")
			throw new Meteor.Error('addUser.unauthorized');

		userSchema.validate(user);

		if(Meteor.isServer){
			const userId = Accounts.createUser(user);
			Accounts.sendEnrollmentEmail(userId); // FIXME: Accounts.emailTemplates
		}
	},
	'updateUser'(userId, user){
		if(Meteor.user().role !== "admin")
			throw new Meteor.Error('updateUser.unauthorized');

		userSchema.validate(user);


		if(Meteor.isServer){
			const oldUser = Meteor.users.findOne(userId);

			Accounts.setUsername(userId, user.username);
			delete user.username;

			for(let email of oldUser.emails){
				if(email.address !== user.email)
					Accounts.removeEmail(userId, email.address);
			}
			Accounts.addEmail(userId, user.email);
			delete user.email;
		}

		const usersUpdated = Meteor.users.update(userId, {
			$set: user
		});

		if(usersUpdated < 1)
			throw new Meteor.Error('updateUser.noUsersFound');
		else if(usersUpdated > 1)
			throw new Meteor.Error('updateUser.multipleUsersFound');
	}
});
