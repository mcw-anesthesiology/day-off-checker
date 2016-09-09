import { Accounts } from 'meteor/accounts-base';

import {
	APP_SITE_NAME,
	APP_ACCOUNTS_EMAIL_ADDRESS,
	ADMIN_EMAIL_ADDRESS,
	USER_ROLES
} from '../../constants.js';

Accounts.onCreateUser((options, user) => {
	user.name = options.name;
	user.role = options.role;
	user.pager = options.pager;
	user.fellow = options.fellow;
	return user;
});

Accounts.emailTemplates.from = APP_ACCOUNTS_EMAIL_ADDRESS;
Accounts.emailTemplates.siteName = APP_SITE_NAME;

Accounts.emailTemplates.resetPassword.html = (user, url) => {
	return `
		<html>
			<body>
				<h1>Hello ${user.name}</h1>

				<p>To reset your password please click the link below.</p>

				<p><a href="${url}">${url}</a></p>

				<p>If you have any questions or concerns please let me know at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

				<p>Thank you!</p>
			</body>
		</html>`;
};

Accounts.emailTemplates.enrollAccount.html = (user, url) => {
	let roleDescription = '';
	switch(user.role){
		case USER_ROLES.ADMIN:
			roleDescription = 'As an administrator, you have full access to create and manage accounts and locations, and view all day off requests.';
			break;
		case USER_ROLES.CHIEF:
			roleDescription = 'As a chief, you have full access to view all day off requests, and must approve or deny all I-Day requests. '
				+ 'You will be notified for all sick day submissions and I-Day requests.';
			break;
		case USER_ROLES.LOCATION_ADMIN:
			roleDescription = 'As a location administrator, you have full access to view all day off requests for the site under your administration. '
				+ 'You will be notified for all sick day submissions and all I-Day requests for your location.';
			break;
		case USER_ROLES.FELLOWSHIP_ADMIN:
			roleDescription = 'As a fellowship director, you have full access to view all requests for your fellowship, and must approve or deny all meeting or vacation requests. '
				+ 'You will be notified for all sick day submissions and all day off requests for your fellows.';
			break;
		case USER_ROLES.RESIDENCY_COORDINATOR:
			roleDescription = 'As residency coordinator, you have full access to view all resident requests. '
				+ 'You will be notified for all sick day submissions and all day off reqeusts made by residents.';
			break;
		case USER_ROLES.FELLOWSHIP_COORDINATOR:
			roleDescription = 'As fellowship coordinator, you have full access to view all fellow requests. '
				+ 'You will be notified for all sick day submissions and all day off reqeusts made by fellows.';
			break;
	}
	return `
		<html>
			<body>
				<h1>Hello ${user.name}</h1>

				<p>
					An account has been created for you on the Anesthesiology department's day off scheduling site,
					<a href="${Meteor.absoluteUrl()}">${Meteor.absoluteUrl()}</a>.
				</p>

				<p>${roleDescription}</p>

				<p>Please click the link below to create your password used to login to the system.</p>

				<p><a href="${url}">${url}</a></p>

				<p>If you have any questions or concerns please let me know at <a href="mailto:${ADMIN_EMAIL_ADDRESS}">${ADMIN_EMAIL_ADDRESS}</a>.</p>

				<p>Thank you!</p>
			</body>
		</html>`;
};
