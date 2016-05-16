// https://github.com/kadirahq/meteor-up

module.exports = {
    servers: {
        one: {
            host: '45.55.211.123',
            username: 'root',
        },
    },

    meteor: {
        name: 'day-off-checker',
        path: './',
        servers: {
            one: {},
        },
        env: {
            // PORT: 80,
            ROOT_URL: 'https://test.dayoff.site',
            MONGO_URL: 'mongodb://localhost/meteor',
            MAIL_URL: 'smtp://40701ebe2b9d2c3ec:18d0ca555fd201@mailtrap.io:2525/'
        },
        ssl: {
            crt: './fullchain.pem',
            key: './privkey.pem',
            port: 443
        },
    },

    mongo: {
        port: 27017,
        servers: {
            one: {},
        },
    },
};
