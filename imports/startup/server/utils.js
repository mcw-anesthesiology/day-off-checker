import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';

import { APP_EMAIL_ADDRESS } from '../../constants.js';

export function alertAdministrator(){
	const adminEmail = "jmischka@mcw.edu"; // FIXME: Put this somewhere better, database probably

	Email.send({
		from: APP_EMAIL_ADDRESS,
		to: adminEmail,
		subject: "Day off checker error",
		text: `An error occurred at ${new Date()}. Check the logs.`
	});
}
