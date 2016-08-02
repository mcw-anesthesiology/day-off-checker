import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { Mongo } from 'meteor/mongo';

import { ADMIN_EMAIL_ADDRESS, APP_NOTIFICATION_EMAIL_ADDRESS } from '../constants.js';
import { alertAdministrator, displayDateRange } from '../utils.js';


export const ReminderEmails = new Mongo.Collection('reminderEmails');

if(Meteor.isServer){
	Meteor.publish('reminderEmails', function(){
		// TODO: Restrict this to user's requests
		if(!this.userId)
			return;
		const user = Meteor.users.findOne(this.userId);

		if(!user)
			return;

		return ReminderEmails.find();
	});
}

Meteor.methods({
	'reminderEmails.scheduleReminder'(request, user, remindTime){
		if(Meteor.user().role !== 'admin')
			throw new Meteor.Error('reminderEmails.scheduleReminder.unauthorized');

		scheduleReminder(request, user, remindTime);
	}
});

export function scheduleReminder(request, user, remindTime){
	const requestUrl = Meteor.absoluteUrl('request/' + request._id);
	ReminderEmails.insert({
		requestId: request._id,
		remindTime: remindTime,
		remindedUser: user.username,
		email: {
			to: user.emails[0].address,
			from: APP_NOTIFICATION_EMAIL_ADDRESS,
			subject: 'I-Day Request Approval Reminder',
			html: `
				<html>
					<body>
						<h1>Hello ${user.name}</h1>

						<p>
							This email is reminding you that <a href="${requestUrl}">
							${request.requestorName}'s I-Day request for ${displayDateRange(request.requestedDate)}</a>
							has been approved.
						</p>

						<p>If you have any questions or concerns please contact me at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

						<p>Thank you!</p>
					</body>
				</html>`
		},
		status: 'pending'
	});
}

export function sendReminders(){
	if(Meteor.isClient)
		return;

	let reminders = ReminderEmails.find({
		status: 'pending',
		remindTime: { $lt: new Date() }
	}).fetch();

	let remindersSent = 0;
	let remindersFailed = 0;
	let timeout = 0; // FIXME
	for(let reminder of reminders){
		try {
			timeout += 1000; // FIXME
			Meteor.setTimeout(() => {
				Email.send(reminder.email);
			}, timeout);

			remindersSent++;
			reminder.status = 'sent';
			ReminderEmails.update({ _id: reminder._id }, reminder);
		} catch(e){
			console.log('Error sending denial notification:', e);

			remindersFailed++;
			reminder.status = 'failed';
			ReminderEmails.update({ _id: reminder._id }, reminder);
		}
	}

	if(remindersFailed > 0)
		alertAdministrator();

	return { // Always going to return 0, 0. Need await.
		sent: remindersSent,
		failed: remindersFailed
	};
}
