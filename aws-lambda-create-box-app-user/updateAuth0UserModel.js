'use strict';
const auth0 = require('./auth0Config')();

module.exports = (auth0Id, boxId) => {
  let params = { id: auth0Id }
  let metadata = {
    boxId: boxId
  }
  return new Promise((resolve, reject) => {
    auth0.updateAppMetadata(params, metadata, function (err, user) {
      if (err) { reject(err); }
      resolve(user);
    });
  });
}