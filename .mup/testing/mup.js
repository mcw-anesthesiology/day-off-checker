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
        name: 'day-off-checker-testing',
        path: '../../',
        servers: {
            one: {}
        },
        env: {
            PORT: 3000,
            NODE_ENV: 'testing',
            ROOT_URL: 'https://test.dayoff.site',
            MONGO_URL: 'mongodb://localhost/meteor',
            MAIL_URL: 'smtp://40701ebe2b9d2c3ec:18d0ca555fd201@mailtrap.io:2525/'
        }
    },

    mongo: {
        port: 27017,
        servers: {
            one: {}
        }
    }
};
