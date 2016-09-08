'use strict';
module.exports = () => {
  const redis = require('redis');
  const awsRedisCreds = {
    AWS_REDIS_PORT: '',
    AWS_REDIS_ADDRESS: ''
  }
  return redis.createClient(awsRedisCreds.AWS_REDIS_PORT, awsRedisCreds.AWS_REDIS_ADDRESS);
}