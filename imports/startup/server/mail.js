const username = "40701ebe2b9d2c3ec";
const password = "18d0ca555fd201";
const host = "mailtrap.io";
const port = "2525";

export const MAIL_URL = `smtp://${username}:${password}@${host}:${port}/`

Meteor.startup(() => {
	process.env.MAIL_URL = MAIL_URL;
});
