import redisClient from "../../config/redisConfig.js";

export async function handleUserBlock(user_id: string): Promise<void> {
    const blockKey = `blocked:user:${user_id}`;
    const BLOCK_DURATION = process.env.USER_BLOCK_DURATION ? parseInt(process.env.USER_BLOCK_DURATION) : 60 * 60;
    
    await redisClient.setEx(blockKey, BLOCK_DURATION, '1');
}