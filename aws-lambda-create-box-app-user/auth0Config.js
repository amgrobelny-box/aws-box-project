'use strict';
module.exports = () => {
  const ManagementClient = require('auth0').ManagementClient;
  const auth0Creds = {
    API_TOKEN: "",
    DOMAIN: ""
  }
  return new ManagementClient({
    token: auth0Creds.API_TOKEN,
    domain: auth0Creds.DOMAIN
  });
}