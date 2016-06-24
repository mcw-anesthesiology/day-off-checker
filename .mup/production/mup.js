/*eslint-env node */
// https://github.com/kadirahq/meteor-up

module.exports = {
    servers: {
        one: {
            host: '45.55.211.123',
            username: 'root'
        }
    },

    meteor: {
        name: 'day-off-checker',
        path: '../../',
        servers: {
            one: {}
        },
        env: {
            PORT: 4000,
            NODE_ENV: 'production',
            ROOT_URL: 'https://www.dayoff.site',
			MONGO_URL: 'mongodb://day-off-checker:GS4hU9ZEXe4juxEz@ds017070.mlab.com:17070/day-off-checker',
            MAIL_URL: 'smtp://postmaster@mg.dayoff.site:8872262b107d6386544df64f197dfc20@smtp.mailgun.org:25/'
        }
    }
};
