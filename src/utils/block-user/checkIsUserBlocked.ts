import redisClient from "../../config/redisConfig.js";
import { BlockStatus } from "../../types.js";

export async function isUserBlocked(user_id: string): Promise<BlockStatus> {
    const blockKey = `blocked:user:${user_id}`;
    const ttl = await redisClient.ttl(blockKey);
    
    return {
        isBlocked: ttl > 0,
        timeToUnblock: ttl > 0 ? ttl : undefined
    };
}