/* @flow */

import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { FlowRouter } from 'meteor/kadira:flow-router';

import fuzzysearch from 'fuzzysearch';
import moment from 'moment';
import 'twix';

import {
	APP_ADMIN_EMAIL_ADDRESS,
	ADMIN_EMAIL_ADDRESS,
	DAY_OFF_FIELDS,
	REQUESTOR_TYPES
} from './constants.js';

import type { User, UserPermission } from './api/users.js';


export function alertAdministrator() {
	Email.send({
		from: APP_ADMIN_EMAIL_ADDRESS,
		to: ADMIN_EMAIL_ADDRESS,
		subject: 'Day off checker error',
		text: `An error occurred at ${new Date()}. Check the logs.`
	});
}

export function displayDate(date) {
	try {
		return moment(date).calendar();
	} catch(e) {
		return '';
	}
}

export function displayDateRange(dates) {
	try {
		return moment(dates[0]).twix(dates[1], true).format();
	} catch(e) {
		return '';
	}
}

export function displayNameByUsername(username) {
	if (!username)
		return '';
	const user = Meteor.users.findOne({ username: username });

	if (!user)
		return username;

	return user.name;
}

export function nl2br(text) {
	return text.replace(/(?:\r\n|\r|\n)/g, '<br />');
}

export function capitalizeFirstLetter(string) {
	try {
		return string.charAt(0).toUpperCase() + string.slice(1);
	} catch(e) {
		return '';
	}
}

export function ucfirst(string) {
	return capitalizeFirstLetter(string);
}

export function camelCaseToWords(string) {
	let result = '';
	for (let char of string) {
		if (result === '') {
			result += char.toUpperCase();
		} else if (char === char.toUpperCase()) {
			result += ' ' + char.toLowerCase();
		} else {
			result += char;
		}
	}
	return result;
}

export function getRequestorType(connection) {
	const hostname = Meteor.isClient
		? window.location.host
		: connection.httpHeaders.host;

	const pieces = hostname.split('.');

	return pieces.length >= 2 && REQUESTOR_TYPES.includes(pieces[0])
		? pieces[0]
		: 'resident';
}

export function isRequestorType(type, connection) {
	return getRequestorType(connection) === type;
}

export function isFellow(connection) {
	return isRequestorType('fellow', connection);
}

export function getRequestRequestorType(request) {
	return request.requestorType
		? request.requestorType
		: request.hasOwnProperty(DAY_OFF_FIELDS.FELLOWSHIP)
			? 'fellow'
			: 'resident';
}

export function isFellowRequest(request) {
	return getRequestRequestorType(request) === 'fellow';
}

export function article(noun) {
	const vowels = ['a', 'e', 'i', 'o', 'u'];
	if (vowels.indexOf(noun.charAt(0).toLowerCase()) !== -1)
		return 'an';
	else
		return 'a';
}

export function userTypeUrl(type) {
	FlowRouter.watchPathChange();
	let basename = window.location.host
		.substring(window.location.host.indexOf('.') + 1);
	let subdomain;
	switch(type.toLowerCase()) {
		case 'fellow':
			subdomain = 'fellow.';
			break;
		case 'intern':
			subdomain = 'intern.';
			break;
		case 'resident':
		default:
			subdomain = Meteor.isDevelopment ? '' : 'www.';
			break;
	}

	return `//${subdomain}${basename}${FlowRouter.current().path}`;
}

export function escapeNewlines(str) {
	return str.replace(/\s+/g, ' ');
}

export function sortNumbers(a, b) {
	return Number(a) - Number(b);
}

export function sortPropNumbers(prop) {
	return (a, b) => sortNumbers(a[prop], b[prop]);
}

export function sortPropLength(prop) {
	return (a, b) => sortNumbers(a[prop].length, b[prop].length);
}

export function sortIgnoreCase(a, b) {
	a = a.toLowerCase();
	b = b.toLowerCase();

	if (a < b)
		return -1;
	if (a > b)
		return 1;

	return 0;
}

export function sortPropIgnoreCase(prop) {
	return (a, b) => sortIgnoreCase(a[prop], b[prop]);
}

export function statusLabelType(status) {
	switch(status) {
		case 'pending':
			return 'label-warning';
		case 'approved':
			return 'label-success';
		case 'denied':
			return 'label-danger';
		case 'cancelled':
			return 'label-default';
		default:
			return 'label-info';
	}
}

export function isValidDateRange(dates) {
	return Boolean(dates) && Array.isArray(dates) && dates.length === 2;
}

export function matchesSearch(request, search) {
	return fuzzysearch(search, request.requestorName)
		|| fuzzysearch(search, request.requestorEmail);
}

export function userHasPermission(user: User, permission: UserPermission): boolean {
	return (user.permissions && user.permissions.length > 0)
		? user.permissions.includes(permission)
		: false;
}

export function getRequestorTypeQuery(
	requestorType: string = getRequestorType()
): Object {
	const query = {};
	switch (requestorType) {
		case 'fellow':
			query.$or = [
				{ [DAY_OFF_FIELDS.REQUESTOR_TYPE]: 'fellow' },
				{ [DAY_OFF_FIELDS.FELLOWSHIP]: { $exists: true } }
			];
			break;
		case 'intern':
			query[DAY_OFF_FIELDS.REQUESTOR_TYPE] = 'intern';
			break;
		case 'resident':
		default:
			query.$or = [
				{ [DAY_OFF_FIELDS.REQUESTOR_TYPE]: 'resident' },
				{
					$and: [
						{
							[DAY_OFF_FIELDS.REQUESTOR_TYPE]: {
								$exists: false
							}
						},
						{
							[DAY_OFF_FIELDS.FELLOWSHIP]: { $exists: false }
						}
					]
				}
			];
			break;
	}

	return query;
}
