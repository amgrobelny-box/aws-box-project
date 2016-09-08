'use strict';
exports.handler = function (event, context, callback) {
    const BoxConstants = require('./boxValues').BoxConstants;
    const needle = require('needle');
    let enterpriseTokenPromise = require('./generateBoxEnterpriseToken.js');
    let createBoxAppUser = require('./createBoxAppUser.js');
    let updateAuth0UserModel = require('./updateAuth0UserModel.js');
    console.log("Requesting enterprise token...");
    enterpriseTokenPromise
        .then((enterpriseToken) => {
            console.log(enterpriseToken);
            return createBoxAppUser(enterpriseToken, event.name);
        })
        .then((boxId) => {
            console.log(boxId);
            return updateAuth0UserModel(event.user_id, boxId);
        })
        .then((user) => {
            callback(null, user);
        })
        .catch((err) => {
            console.log(err);
            callback(err);
        });
}