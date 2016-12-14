'use strict';

const got = require('got');
const https = require('https');
const url = require('url');

const defaults = {
    username: '',
    password: '',
    port: 8443,
    url: 'https://192.168.0.1',
    site: 'default',
    ignoreSsl: false
};

function unifi (inConfig) {
    const config = Object.assign(defaults, inConfig);
    const baseUrl = `${config.url}:${config.port}`;
    const hostname = url.parse(baseUrl).hostname;

    let agent;

    const loginOptions = {
        method: 'POST',
        body: JSON.stringify({
            username: config.username,
            password: config.password
        })
    };

    if (config.ignoreSsl) {
        agent = new https.Agent({
        host: hostname,
        port: config.port,
        path: '/',
        rejectUnauthorized: false
        });
        loginOptions.agent = agent;
    }

    console.log(`${baseUrl}/api/login`);

    const getSessionCookie = () => got(`${baseUrl}/api/login`, loginOptions).then(result => {
        const cookie = result.headers['set-cookie'];
        if (!cookie) {
            throw new Error('Invalid Login Cookie');
        }
        return cookie;
    });

    return getSessionCookie().then(cookie => {
        const options = {
            headers: { cookie },
            json: true
        };

        if (config.ignoreSsl) {
            options.agent = agent;
        }

        const get = (url) =>
            got(`${baseUrl}/api/s/${config.site}/${url}`, options).then(result => result.body.data);

        return {
            getAccessPoints: () => get('stat/device'),
            getClients: () => get('stat/sta'),
            get: get
        };
    });
}

module.exports = unifi;
