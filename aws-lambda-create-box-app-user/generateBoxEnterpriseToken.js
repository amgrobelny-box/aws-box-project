'use strict';
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const needle = require('needle');
const BoxConstants = require('./boxValues').BoxConstants;
const BoxConfig = require('./boxValues').BoxConfig;
const enterpriseTokenKey = "enterpriseToken";

let redisClient = require('./redisConfig')();
let enterpriseToken, error;
module.exports = new Promise((resolve, reject) => {
  redisClient.on('end', () => {
    console.log("Ending connection to Redis...");
    if (error) {
      console.log(error);
      reject(error);
    }
    console.log(enterpriseToken);
    resolve(enterpriseToken);
  });

  redisClient.get(enterpriseTokenKey, function (err, cachedEnterpriseToken) {
    if (err) {
      redisClient.quit(() => {
        error = err;
      });
    }
    cachedEnterpriseToken = (cachedEnterpriseToken) ? JSON.parse(cachedEnterpriseToken) : null;
    if (cachedEnterpriseToken && cachedEnterpriseToken.expires_at > Date.now()) {
      redisClient.quit(() => {
        enterpriseToken = cachedEnterpriseToken;
      });
    } else {
      let certPath = path.resolve(BoxConfig.jwtPrivateKey)
      let cert = fs.readFileSync(certPath);
      let privateKeyPackage = { key: cert, passphrase: BoxConfig.jwtPrivateKeyPassword };
      let jwtPackage = {
        "iss": BoxConfig.clientId,
        "aud": BoxConstants.BASE_URL,
        "jti": uuid.v4()
      };

      jwtPackage["sub"] = BoxConfig.enterpriseId;
      jwtPackage["box_sub_type"] = BoxConstants.ENTERPRISE;

      let token = jwt.sign(
        jwtPackage,
        privateKeyPackage,
        {
          header: {
            "alg": BoxConstants.DEFAULT_SETTINGS.JWT_ALGORITHM,
            "typ": BoxConstants.DEFAULT_SETTINGS.JWT_TYPE,
            "kid": BoxConfig.jwtPublicKeyId
          },
          noTimestamp: true,
          expiresIn: BoxConstants.DEFAULT_SETTINGS.JWT_EXPIRATION
        }
      );

      let formData = {
        grant_type: BoxConstants.DEFAULT_SETTINGS.JWT_GRANT_TYPE,
        client_id: BoxConfig.clientId,
        client_secret: BoxConfig.clientSecret,
        assertion: token
      }

      needle.post(BoxConstants.BASE_URL, formData, (err, resp) => {
        if (err) {
          redisClient.quit(() => {
            error = err;
          });
        }

        resp.body.expires_at = Date.now() + (resp.body.expires_in * 1000);
        redisClient.set(enterpriseTokenKey, JSON.stringify(resp.body), function (err, reply) {
          redisClient.quit(() => {
            enterpriseToken = resp.body.access_token;
          });
        });
      });
    }
  });
});