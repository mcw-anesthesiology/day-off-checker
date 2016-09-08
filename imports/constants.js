export const APP_SITE_NAME = 'dayoff.site';
export const APP_ADMIN_EMAIL_ADDRESS = 'admin@dayoff.site';
export const APP_ACCOUNTS_EMAIL_ADDRESS = 'accounts@dayoff.site';
export const APP_NOTIFICATION_EMAIL_ADDRESS = 'notification@dayoff.site';
export const ADMIN_EMAIL_ADDRESS = 'jmischka@mcw.edu';

export const DAYS_BEFORE_I_DAY_TO_SEND_REMINDER = 5;

export const DAY_OFF_FIELDS = {
	TYPE: 'dayOffType',
	NAME: 'requestorName',
	EMAIL: 'requestorEmail',
	DATE: 'requestedDate',
	FELLOWSHIP: 'requestedFellowship',
	LOCATION: 'requestedLocation',
	REASON: 'requestReason'
};

export const DAY_OFF_FIELD_NAMES = {
	[DAY_OFF_FIELDS.TYPE]: 'Type',
	[DAY_OFF_FIELDS.NAME]: 'Name',
	[DAY_OFF_FIELDS.EMAIL]: 'Email',
	[DAY_OFF_FIELDS.DATE]: 'Date',
	[DAY_OFF_FIELDS.FELLOWSHIP]: 'Fellowship',
	[DAY_OFF_FIELDS.LOCATION]: 'Location',
	[DAY_OFF_FIELDS.REASON]: 'Reason'
};

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
	[DAY_OFF_TYPES.I_DAY]: 'I-Day',
	[DAY_OFF_TYPES.MEETING]: 'Meeting',
	[DAY_OFF_TYPES.VACATION]: 'Vacation'
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

export const USER_ROLES = {
	ADMIN: 'admin',
	LOCATION_ADMIN: 'location_admin',
	FELLOWSHIP_ADMIN: 'fellowship_admin',
	CHIEF: 'chief',
	RESIDENCY_COORDINATOR: 'residency_coordinator',
	FELLOWSHIP_COORDINATOR: 'fellowship_coordinator'
};

export const USER_ROLE_NAMES = {
	[USER_ROLES.ADMIN]: 'Administrator',
	[USER_ROLES.LOCATION_ADMIN]: 'Site Administrator',
	[USER_ROLES.FELLOWSHIP_ADMIN]: 'Fellowship Director',
	[USER_ROLES.CHIEF]: 'Chief Resident',
	[USER_ROLES.RESIDENCY_COORDINATOR]: 'Residency Coordinator',
	[USER_ROLES.FELLOWSHIP_COORDINATOR]: 'Fellowship Coordinator'
};
