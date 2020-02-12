/* @flow */

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Email } from 'meteor/email';
import { Accounts } from 'meteor/accounts-base';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { handleError } from 'meteor/saucecode:rollbar';

import { Fellowships } from './fellowships.js';

import { APP_ACCOUNTS_EMAIL_ADDRESS, ADMIN_EMAIL_ADDRESS, DAY_OFF_TYPES, DAY_OFF_TYPE_NAMES } from '../constants.js';

import map from 'lodash/map';

export type Location = {
	_id: string,
	name: string,
	number: string,
	administrator: string,
	fellowship: string
};

export const Locations = new Mongo.Collection('locations');

if(Meteor.isServer){
	Meteor.publish('locations', function(){
		return Locations.find();
	});
}

if(Meteor.isClient){
	Meteor.subscribe('fellowships');
}

Meteor.methods({
	'addLocation'(location){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('addLocation.unauthorized');

		const locationAdmins = Meteor.users.find({
			role: 'location_admin',
			inactive: {
				$in: [
					null,
					false
				]
			}
		}).fetch();
		const fellowships = Fellowships.find({}).fetch();

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
				allowedValues: map(locationAdmins, 'username')
			},
			fellowship: {
				type: String,
				label: 'Fellowship ID',
				allowedValues: map(fellowships, '_id'),
				optional: true
			}
		}).validate(location);

		Locations.insert(location);

		if(Meteor.isServer){
			notifyNewLocationAdmin(location);
		}
	},
	'updateLocation'(locationId, location){ // TODO: More validation?
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('updateLocation.unauthorized');

		const locationAdmins = Meteor.users.find({
			role: 'location_admin',
			inactive: {
				$in: [
					null,
					false
				]
			}
		}).fetch();
		const fellowships = Fellowships.find({}).fetch();

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
				allowedValues: map(locationAdmins, 'username')
			},
			fellowship: {
				type: String,
				label: 'Fellowship ID',
				allowedValues: map(fellowships, '_id'),
				optional: true
			}
		}).validate(location);

		const oldLocation = Locations.findOne(locationId);

		Locations.update(locationId, location);

		if(Meteor.isServer && oldLocation.administrator !== location.administrator){
			notifyNewLocationAdmin(location);
		}
	}
});

function notifyNewLocationAdmin(location){
	const fellowshipStr = location.fellowship
		? ` for the <b>${location.fellowship} fellowship</b>`
		: '';
	try {
		const user = Accounts.findUserByUsername(location.administrator);
		Email.send({
			from: APP_ACCOUNTS_EMAIL_ADDRESS,
			to: user.emails[0].address,
			subject: 'New location administrator',
			html: `
				<html>
					<body>
						<h1>Hello ${user.name}</h1>
						<p>
							This email is notifying you that you have been added as an administrator in the Anesthesiology department's day off
							management site for ${location.name}${fellowshipStr}.
						</p>
						<p>
							You will be notified when anyone from this location requests a day off, and you will have to login
							to approve or deny their ${DAY_OFF_TYPE_NAMES[DAY_OFF_TYPES.I_DAY]} requests. You can do this via the link sent to you in the email,
							or via the <a href="${Meteor.absoluteUrl('list')}">requests list</a> by clicking on the request in the table.
						</p>
						<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

						<p>Thank you!</p>
					</body>
				</html>`
		});
	}
	catch(e){
		console.log('Error notifying new location admin: ' + e);
		handleError(e);
	}
}
