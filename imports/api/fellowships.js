import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email } from 'meteor/email';
import { Accounts } from 'meteor/accounts-base';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { handleError } from 'meteor/saucecode:rollbar';

import map from 'lodash/map';

import { APP_ACCOUNTS_EMAIL_ADDRESS, ADMIN_EMAIL_ADDRESS } from '../constants.js';

export const Fellowships = new Mongo.Collection('fellowships');

if(Meteor.isServer){
	Meteor.publish('fellowships', function(){
		return Fellowships.find({});
	});
}

Meteor.methods({
	'addFellowship'(fellowship){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('addFellowship.unauthorized');

		const fellowshipAdmins = Meteor.users.find({
			role: 'fellowship_admin',
			inactive: {
				$in: [
					null,
					false
				]
			}
		}).fetch();

		new SimpleSchema({
			_id: {
				type: String,
				label: 'Fellowship ID'
			},
			name: {
				type: String,
				label: 'Fellowship name'
			},
			number: {
				type: String,
				label: 'Fellowship number' // TODO: restrict this to actual numbers?
			},
			administrators: {
				type: [String],
				label: 'Fellowship administrator username',
				allowedValues: map(fellowshipAdmins, 'username')
			}
		}).validate(fellowship);

		Fellowships.insert(fellowship);

		if(Meteor.isServer) {
			notifyNewFellowshipAdmins(fellowship.administrators, fellowship);
		}
	},
	'updateFellowship'(fellowshipId, fellowship){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('updateFellowship.unauthorized');

		const fellowshipAdmins = Meteor.users.find({
			role: 'fellowship_admin',
			inactive: {
				$in: [
					null,
					false
				]
			}
		}).fetch();

		new SimpleSchema({
			_id: {
				type: String,
				label: 'Fellowship ID'
			},
			name: {
				type: String,
				label: 'Fellowship name'
			},
			number: {
				type: String,
				label: 'Fellowship number' // TODO: restrict this to actual numbers?
			},
			administrators: {
				type: [String],
				label: 'Fellowship administrator usernames',
				allowedValues: map(fellowshipAdmins, 'username')
			}
		}).validate(fellowship);

		const oldFellowship = Fellowships.findOne(fellowshipId);

		Fellowships.update(fellowshipId, fellowship);

		if (Meteor.isServer) {
			const newAdministrators = fellowship.administrators.filter(a => !oldFellowship.administrators.includes(a));
			notifyNewFellowshipAdmins(newAdministrators, fellowship);
		}
	}
});

function notifyNewFellowshipAdmins(newAdministrators, fellowship){
	for (const username of newAdministrators) {
		try {
			const user = Accounts.findUserByUsername(username);
			Email.send({
				from: APP_ACCOUNTS_EMAIL_ADDRESS,
				to: user.emails[0].address,
				subject: 'New fellowship administrator',
				html: `
				<html>
					<body>
						<h1>Hello ${user.name}</h1>
						<p>
							This email is notifying you that you have been added as a fellowship administrator in the Anesthesiology department's day off
							management site for ${fellowship.name}.
						</p>
						<p>
							You will be notified when any fellow from your fellowship requests a day off or requires a sick day, and you will have to login
							to approve or deny their requests. You can do this via the link sent to you in the email,
							or via the <a href="${Meteor.absoluteUrl('list')}">requests list</a> by clicking on the request in the table.
						</p>
						<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

						<p>Thank you!</p>
					</body>
				</html>`
		});
		} catch(e){
			console.log('Error notifying new fellowship admin: ' + e);
			handleError(e);
		}
	}
}
