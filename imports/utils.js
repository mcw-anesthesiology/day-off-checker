import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { FlowRouter } from 'meteor/kadira:flow-router';

import moment from 'moment';
import 'twix';

import {
	APP_ADMIN_EMAIL_ADDRESS,
	ADMIN_EMAIL_ADDRESS,
	DAY_OFF_FIELDS
} from './constants.js';


export function alertAdministrator(){
	Email.send({
		from: APP_ADMIN_EMAIL_ADDRESS,
		to: ADMIN_EMAIL_ADDRESS,
		subject: 'Day off checker error',
		text: `An error occurred at ${new Date()}. Check the logs.`
	});
}

export function displayDate(date){
	try {
		return moment(date).calendar();
	}
	catch(e){
		return '';
	}
}

export function displayDateRange(dates){
	try {
		return moment(dates[0]).twix(dates[1], true).format();
	}
	catch(e){
		return '';
	}
}

export function displayNameByUsername(username){
	if(!username)
		return '';
	const user = Meteor.users.findOne({ username: username });
	return user.name;
}

export function nl2br(text){
	return text.replace(/(?:\r\n|\r|\n)/g, '<br />');
}

export function capitalizeFirstLetter(string){
	return string.charAt(0).toUpperCase() + string.slice(1);
}

export function camelCaseToWords(string){
	let result = '';
	for(let char of string){
		if(result === ''){
			result += char.toUpperCase();
		}
		else if(char === char.toUpperCase()){
			result += ' ' + char.toLowerCase();
		}
		else {
			result += char;
		}
	}
	return result;
}

export function isFellow(connection){
	let hostname;
	if(Meteor.isClient)
		hostname = window.location.host;
	else
		hostname = connection.httpHeaders.host;

	return hostname.split('.')[0] === 'fellow';
}

export function isFellowRequest(request){
	return request.hasOwnProperty(DAY_OFF_FIELDS.FELLOWSHIP);
}

export function article(noun){
	const vowels = ['a', 'e', 'i', 'o', 'u'];
	if(vowels.indexOf(noun.charAt(0).toLowerCase()) !== -1)
		return 'an';
	else
		return 'a';
}

export function userTypeUrl(type){
	FlowRouter.watchPathChange();
	let basename = window.location.host.substring(window.location.host.indexOf('.') + 1);
	if(type.toLowerCase() === 'fellow')
		return '//fellow.' + basename
			+ FlowRouter.current().path;

	return '//' + basename
		+ FlowRouter.current().path;
}

export function escapeNewlines(str){
	return str.replace(/\s+/g, ' ');
}
