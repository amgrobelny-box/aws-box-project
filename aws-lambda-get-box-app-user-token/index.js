'use strict';

exports.handler = function (event, context, callback) {
    let redisClient = require('./redisConfig')();
    let auth0 = require('./auth0Config')();
    let generateBoxUserToken = require('./generateBoxUserToken.js');

    let response;
    let error;
    redisClient.on('end', () => {
        console.log("Ending connection to Redis...");
        console.log(response);
        callback(error, response);
    });

    // Verify identify from Auth0 using Auth0 JWT token
    auth0.tokens.getInfo(event.token)
        .then(function (profile) {
            console.log("Auth0 call complete...");
            console.log(profile);
            if (profile && profile.app_metadata && profile.app_metadata.boxId) {
                console.log("Attempting to retrieve box token from cache...");
                redisClient.get(profile.app_metadata.boxId, function (err, boxToken) {
                    if (err) {
                        console.log("There was an error.");
                        redisClient.quit(() => {
                            error = err;
                        });
                    }
                    console.log(boxToken);
                    boxToken = (boxToken) ? JSON.parse(boxToken) : null;
                    console.log(boxToken);
                    console.log(Date.now().toString());
                    if (boxToken && boxToken.expires_at > Date.now()) {
                        redisClient.quit(() => {
                            response = boxToken;
                        });
                    } else {
                        generateBoxUserToken(profile.app_metadata.boxId)
                            .then((boxUserToken) => {
                                console.log("Setting token in Elasticache");
                                redisClient.set(profile.app_metadata.boxId, JSON.stringify(boxUserToken), function (err, reply) {
                                    redisClient.quit(() => {
                                        response = boxUserToken;
                                    });
                                });
                            })
                            .catch((err) => {
                                redisClient.quit(() => {
                                    error = err;
                                });
                            });
                    }
                });

            } else {
                var err = {
                    message: "This user is not properly authenicated."
                };
                error = err;
            }
        })
        .catch(function (err) {
            console.log(err);
            error = err;
        });
}