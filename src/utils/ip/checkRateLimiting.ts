import redisClient from "../../config/redisConfig.js";
import { RateLimitResponse } from "../../types.js";

export default async function checkRateLimit(ip: string): Promise<RateLimitResponse> {
    const ipKey = `ratelimit:${ip}`;
    const MAX_REQUESTS = process.env.MAX_IP_ATTEMPTS ? parseInt(process.env.MAX_IP_ATTEMPTS) : 10;  // Max requests tolerance from an ip address
    const WINDOW_SECONDS = process.env.WINDOW_SECONDS ? parseInt(process.env.WINDOW_SECONDS) : 60;  // TTL Window
    
    try {
        const requests = await redisClient.incr(ipKey);
        
        if (requests === 1) {
            await redisClient.expire(ipKey, WINDOW_SECONDS);
        }
        
        if (requests > MAX_REQUESTS) {
            const ttl = await redisClient.ttl(ipKey);
            return { isAllowed: false, timeToReset: ttl };
        }
        
        return { isAllowed: true };
    } catch (error) {
        console.error('Rate limit check failed:', error);
        return { isAllowed: true };
    }
}

