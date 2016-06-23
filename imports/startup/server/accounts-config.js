import { Accounts } from 'meteor/accounts-base';

import { APP_SITE_NAME, APP_ACCOUNTS_EMAIL_ADDRESS, ADMIN_EMAIL_ADDRESS } from '../../constants.js';

Accounts.onCreateUser((options, user) => {
	user.name = options.name;
	user.role = options.role;
	user.notify = options.notify;
	user.pager = options.pager;
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
			</body>
		</html>`;
};

Accounts.emailTemplates.enrollAccount.html = (user, url) => {
	let roleDescription = '';
	switch(user.role){
		case 'admin':
			roleDescription = 'As an administrator, you have full access to create and manage accounts and locations, and view all day off requests.';
			if(user.notify)
				roleDescription += ' Additionally, you will also be notified of all sick day submissions and I-Day request approvals and denials.';
			break;
		case 'chief':
			roleDescription = 'As a chief, you have full access to view all day off requests, and must approve or deny all I-Day requests. '
				+ 'You will be notified for all sick day submissions and I-Day requests.';
			break;
		case 'location_admin':
			roleDescription = 'As a location administrator, you have full access to view all day off requests for the site under your administration. '
				+ 'You will be notified for all sick day submissions and all I-Day requests for your location.';
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
