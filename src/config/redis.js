const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
    socket: {
        host: 'redis-14939.c330.asia-south1-1.gce.redns.redis-cloud.com',
        port: 14939
    },
    username: 'default',
    password: 'ShLwv26YUe466KNsDxEQggahWhNXh16i'
});

redisClient.on('error', (err) => console.error('Redis Error:', err));

(async () => {
    await redisClient.connect();
    console.log('Redis Connected');
})();

module.exports = redisClient;
