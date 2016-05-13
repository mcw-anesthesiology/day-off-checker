import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

if(Meteor.isServer){
	Meteor.publish('currentUserData', function(){
		if(this.userId)
			return Meteor.users.find({_id: this.userId}, { fields: {
				name: 1,
				role: 1
			}});
		else
			this.ready();
	});

	Meteor.publish('chiefUserData', function(){
		return Meteor.users.find({ role: 'chief' }, { fields: {
			name: 1,
			username: 1,
			role: 1,
			pager: 1
		}});
	});

	Meteor.publish('allUserData', function(){
		return Meteor.users.find({}, { fields: {
			_id: 1,
			username: 1,
			name: 1,
			role: 1,
			pager: 1,
			emails: 1,
			notify: 1
		}});
	});

	Meteor.publish('locationAdminUserData', function(){
		return Meteor.users.find({ role: 'location_admin' }, { fields: {
			_id: 1,
			username: 1,
			role: 1,
			name: 1
		}});
	});

	Meteor.publish('notifyUserData', function(){
		return Meteor.users.find({ notify: true }, { fields: {
			username: 1,
			name: 1,
			notify: 1
		}});
	});
}

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
	},
	notify: {
		type: Boolean,
		label: "Notify",
		optional: true
	}
});

Meteor.methods({
	'addUser'(user){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('addUser.unauthorized');

		if(user.notify)
			user.notify = true;

		userSchema.validate(user);

		if(Meteor.isServer){
			const userId = Accounts.createUser(user);
			Accounts.sendEnrollmentEmail(userId);
		}
	},
	'updateUser'(userId, user){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('updateUser.unauthorized');

		if(user.notify)
			user.notify = true;

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
	},
	'resendEnrollmentEmail'(userId){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('resendEnrollmentEmail.unauthorized');

		if(Meteor.isServer)
			Accounts.sendEnrollmentEmail(userId);
	}
});
