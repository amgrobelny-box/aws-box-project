'use strict';
const needle = require('needle');
const BoxConstants = require('./boxValues').BoxConstants;

module.exports = (enterpriseToken, name) => {
  let options = {
    headers: {
      'Authorization': 'Bearer ' + enterpriseToken
    },
    json: true
  }
  return new Promise((resolve, reject) => {
    needle.post(BoxConstants.APP_USERS_URL, { name: name, is_platform_access_only: true }, options, function (err, resp) {
      if (err) { reject(err); }
      resolve(resp.body.id);
    });
  });
}