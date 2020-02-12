export const APP_SITE_NAME = 'dayoff.site';
export const APP_ADMIN_EMAIL_ADDRESS = 'admin@dayoff.site';
export const APP_ACCOUNTS_EMAIL_ADDRESS = 'accounts@dayoff.site';
export const APP_NOTIFICATION_EMAIL_ADDRESS = 'notification@dayoff.site';
export const ADMIN_EMAIL_ADDRESS = 'jmischka@mcw.edu';
export const DAYS_BEFORE_REQUEST_TO_SEND_REMINDER = 5;
export const ISO_DATE_FORMAT = 'Y-MM-DD';

export const SCREEN_BREAKPOINTS = {
	SMALL_MOBILE: 480,
	ON_DESKTOP: 768,
	MEDIUM_DESKTOP: 992,
	LARGE_DESKTOP: 1200
};

export const DAY_OFF_FIELDS = {
	TYPE: 'dayOffType',
	REQUESTOR_TYPE: 'requestorType',
	NAME: 'requestorName',
	EMAIL: 'requestorEmail',
	DATE: 'requestedDate',
	FELLOWSHIP: 'requestedFellowship',
	LOCATION: 'requestedLocation',
	REASON: 'requestReason',

	ADDITIONAL_FELLOWSHIP_INFO: 'additionalFellowshipInfo'
};

export const DAY_OFF_FIELD_NAMES = {
	[DAY_OFF_FIELDS.TYPE]: 'Type',
	[DAY_OFF_FIELDS.REQUESTOR_TYPE]: 'Requestor Type',
	[DAY_OFF_FIELDS.NAME]: 'Name',
	[DAY_OFF_FIELDS.EMAIL]: 'Email',
	[DAY_OFF_FIELDS.DATE]: 'Date',
	[DAY_OFF_FIELDS.FELLOWSHIP]: 'Fellowship',
	[DAY_OFF_FIELDS.LOCATION]: 'Location',
	[DAY_OFF_FIELDS.REASON]: 'Reason',

	[DAY_OFF_FIELDS.ADDITIONAL_FELLOWSHIP_INFO]: 'Additional info'
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
	[DAY_OFF_TYPES.I_DAY]: 'Meeting day',
	[DAY_OFF_TYPES.MEETING]: 'Meeting',
	[DAY_OFF_TYPES.VACATION]: 'Vacation'
};

export const DAY_OFF_TYPE_COLORS = {
	[DAY_OFF_TYPES.SICK]: {
		background: '#4fc3f7',
		border: '#039be5'
	},
	[DAY_OFF_TYPES.I_DAY]: {
		background: '#aed581',
		border: '#7cb342'
	},
	[DAY_OFF_TYPES.MEETING]: {
		background: '#9575cd',
		border: '#5e35b1'
	},
	[DAY_OFF_TYPES.VACATION]: {
		background: '#ffb74d',
		border: '#fb8c00'
	},
	'pending': {
		background: '#f0ad4e',
		border: '#eea236'
	},
	'approved': {
		background: '#5cb85c',
		border: '#4cae4c'
	},
	'denied': {
		background: '#d9534f',
		border: '#d43f3a'
	},
	'cancelled': {
		background: '#b4b4b4',
		border: '#888888'
	}
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

export const INTERN_DAY_OFF_TYPES = [
	DAY_OFF_TYPES.SICK
];

export const REQUESTOR_TYPES = [
	'resident',
	'fellow',
	'intern'
];

export const USER_ROLES = {
	ADMIN: 'admin',
	LOCATION_ADMIN: 'location_admin',
	FELLOWSHIP_ADMIN: 'fellowship_admin',
	CHIEF: 'chief',
	RESIDENCY_COORDINATOR: 'residency_coordinator',
	FELLOWSHIP_COORDINATOR: 'fellowship_coordinator',
	INTERN_COORDINATOR: 'intern_coordinator'
};

export const USER_ROLE_NAMES = {
	[USER_ROLES.ADMIN]: 'Administrator',
	[USER_ROLES.LOCATION_ADMIN]: 'Site Administrator',
	[USER_ROLES.FELLOWSHIP_ADMIN]: 'Fellowship Director',
	[USER_ROLES.CHIEF]: 'Chief Resident',
	[USER_ROLES.RESIDENCY_COORDINATOR]: 'Residency Coordinator',
	[USER_ROLES.FELLOWSHIP_COORDINATOR]: 'Fellowship Coordinator',
	[USER_ROLES.INTERN_COORDINATOR]: 'Intern Coordinator'
};

export const USER_PERMISSION_NAMES = {
	VIEW_RESIDENT_REQUESTS: 'View resident requests',
	VIEW_INTERN_REQUESTS: 'View intern requests',
	VIEW_FELLOW_REQUESTS: 'View fellow requests'
};
