'use strict';
module.exports = () => {
  const AuthenticationClient = require('auth0').AuthenticationClient;
  const auth0Creds = {
    AUTH0_CLIENT_ID: '',
    AUTH0_DOMAIN: ''
  }

  return new AuthenticationClient({
    domain: auth0Creds.AUTH0_DOMAIN,
    clientId: auth0Creds.AUTH0_CLIENT_ID
  });
}