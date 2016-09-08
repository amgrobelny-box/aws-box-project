'use strict';
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const needle = require('needle');
const BoxConstants = require('./boxValues').BoxConstants;
const BoxConfig = require('./boxValues').BoxConfig;

module.exports = (boxId) => {
  let certPath = path.resolve(BoxConfig.jwtPrivateKey)
  let cert = fs.readFileSync(certPath);
  BoxConfig.privateKeyFile = cert;
  console.log("Read PEM");
  let privateKeyPackage = { key: cert, passphrase: BoxConfig.jwtPrivateKeyPassword };
  let jwtPackage = {
    "iss": BoxConfig.clientId,
    "aud": BoxConstants.BASE_URL,
    "jti": uuid.v4()
  };

  jwtPackage["sub"] = boxId;
  jwtPackage["box_sub_type"] = BoxConstants.USER;

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

  console.log("Constructed JWT");
  return new Promise((resolve, reject) => {
    needle.post(BoxConstants.BASE_URL, formData, function (err, resp) {
      console.log("Inside call to Box");
      console.log(resp.body);
      if (err) {
        reject(err);
      }
      resp.body.expires_at = Date.now() + (resp.body.expires_in * 1000);
      resolve(resp.body);
    });
  });
}