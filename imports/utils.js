import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';

import moment from 'moment';
import 'twix';

import { APP_EMAIL_ADDRESS } from './constants.js';


export function alertAdministrator(){
	const adminEmail = "jmischka@mcw.edu"; // FIXME: Put this somewhere better, database probably

	Email.send({
		from: APP_EMAIL_ADDRESS,
		to: adminEmail,
		subject: "Day off checker error",
		text: `An error occurred at ${new Date()}. Check the logs.`
	});
}

export function displayDate(date){
	try {
		return moment(date).calendar();
	}
	catch(e){
		return "";
	}
}

export function displayDateRange(dates){
	try {
		return moment(dates[0]).twix(dates[1], true).format();
	}
	catch(e){
		return "";
	}
}

export function displayNameByUsername(username){
	if(!username)
		return "";
	const user = Meteor.users.findOne({ username: username });
	return user.name;
}

export function nl2br(text){
	return text.replace(/(?:\r\n|\r|\n)/g, '<br />');
}

export function capitalizeFirstLetter(string){
	return string.charAt(0).toUpperCase() + string.slice(1);
}
