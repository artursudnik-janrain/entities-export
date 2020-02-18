"use strict";

const axios = require('axios'),
      http  = require('http'),
      https = require('https');

const instance = axios.create({
    httpAgent:  new http.Agent({keepAlive: true}),
    httpsAgent: new https.Agent({keepAlive: true}),
});

instance.interceptors.response.use((response) => {
    if (response.data.error) {
        const error = new Error(response.data.error_description);
        error.type = 'capture_api';
        error.code = response.data.error.toUpperCase();
        return Promise.reject(error)
    }
    return response;
}, (err) => {
    return Promise.reject(err);
});

module.exports = instance;