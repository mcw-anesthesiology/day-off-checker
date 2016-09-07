export const APP_SITE_NAME = 'dayoff.site';
export const APP_ADMIN_EMAIL_ADDRESS = 'admin@dayoff.site';
export const APP_ACCOUNTS_EMAIL_ADDRESS = 'accounts@dayoff.site';
export const APP_NOTIFICATION_EMAIL_ADDRESS = 'notification@dayoff.site';
export const ADMIN_EMAIL_ADDRESS = 'jmischka@mcw.edu';

export const DAYS_BEFORE_I_DAY_TO_SEND_REMINDER = 5;

export const DAY_OFF_TYPES = {
	SICK: 'sick',

	// Residents only
	I_DAY: 'iDay',

	// Fellows only
	MEETING: 'meeting',
	VACATION: 'vacation'
};

export const DAY_OFF_TYPE_NAMES = {
	[DAY_OFF_TYPES.SICK]: 'Sick day',
	[DAY_OFF_TYPES.I_DAY]: 'I-Day request',
	[DAY_OFF_TYPES.MEETING]: 'Meeting request',
	[DAY_OFF_TYPES.VACATION]: 'Vacation request'
};

export const RESIDENT_DAY_OFF_TYPES = [
	DAY_OFF_TYPES.SICK,
	DAY_OFF_TYPES.I_DAY
];

export const FELLOW_DAY_OFF_TYPES = [
	DAY_OFF_TYPES.SICK,
	DAY_OFF_TYPES.MEETING,
	DAY_OFF_TYPES.VACATION
];
