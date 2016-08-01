import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email } from 'meteor/email';
import { Accounts } from 'meteor/accounts-base';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { alertAdministrator } from '../utils.js';

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

		const fellowshipAdmins = Meteor.users.find({ role: 'fellowship_admin' }).fetch();

		new SimpleSchema({
			_id: {
				type: String,
				label: 'Location ID'
			},
			name: {
				type: String,
				label: 'Location name'
			},
			number: {
				type: String,
				label: 'Location number' // TODO: restrict this to actual numbers?
			},
			administrator: {
				type: String,
				label: 'Location administrator username',
				allowedValues: map(fellowshipAdmins, 'username')
			}
		}).validate(fellowship);

		Fellowships.insert(fellowship);

		if(Meteor.isServer)
			notifyNewFellowshipAdmin(fellowship);
	},
	'updateFellowship'(fellowshipId, fellowship){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('updateFellowship.unauthorized');

		const fellowshipAdmins = Meteor.users.find({ role: 'fellowship_admin' }).fetch();

		new SimpleSchema({
			_id: {
				type: String,
				label: 'Location ID'
			},
			name: {
				type: String,
				label: 'Location name'
			},
			number: {
				type: String,
				label: 'Location number' // TODO: restrict this to actual numbers?
			},
			administrator: {
				type: String,
				label: 'Location administrator username',
				allowedValues: map(fellowshipAdmins, 'username')
			}
		}).validate(fellowship);

		const oldFellowship = Fellowships.findOne(fellowshipId);

		Fellowships.update(fellowshipId, fellowship);

		if(Meteor.isServer && oldFellowship.administrator !== fellowship.administrator)
			notifyNewFellowshipAdmin(fellowship);
	}
});

function notifyNewFellowshipAdmin(fellowship){
	try {
		const user = Accounts.findUserByUsername(fellowship.administrator);
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
							management site for ${location.name}.
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
		alertAdministrator();
	}
}