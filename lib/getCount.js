"use strict";

const axios       = require('./axios'),
      querystring = require('querystring');

module.exports = async function (options) {
    const {
              clientId,
              clientSecret,
              realm,
              entity,
              minLastUpdated
          } = options;

    const endpoint   = `https://${realm}.janraincapture.com/entity.count`,
          authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

    const params = {
        type_name: entity,
    };

    if (minLastUpdated) {
        params.filter = `lastUpdated>'${minLastUpdated}'`;
    }

    const response = await axios.post(endpoint, querystring.stringify(params), {
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Authorization': authHeader
        }
    });

    return response.data.total_count;
};