import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();


const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6537')
    }
});

export default redisClient;

