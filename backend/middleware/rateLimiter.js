const rateLimit = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const Redis = require('ioredis')

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
})

// Create Rate Limiter middleware to prevent api abuse
const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: async (...args) => redis.call(...args),
    prefix: 'rate-limit:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
})

module.exports = limiter
