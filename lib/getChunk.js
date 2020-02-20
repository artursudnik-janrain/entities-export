"use strict";

const axios       = require('./axios'),
      querystring = require('querystring');

module.exports = async function (options) {
    const {
              pageSize = 10,
              clientId,
              clientSecret,
              realm,
              entity,
              minId    = 0,
              minLastUpdated
          } = options;

    const endpoint   = `https://${realm}.janraincapture.com/entity.find`,
          authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

    const params = {
        type_name  : entity,
        max_results: pageSize,
        filter     : `id>${minId}${minLastUpdated ? ` and lastUpdated>'${minLastUpdated}'` : ''}`,
        sort_on    : JSON.stringify(["id"])
    };

    const response = await axios.post(endpoint, querystring.stringify(params), {
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Authorization': authHeader
        }
    });

    return response.data.results;
};
