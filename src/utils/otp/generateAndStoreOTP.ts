import redisClient from "../../config/redisConfig.js";
import { isUserBlocked } from "../block/checkIsUserBlocked.js";
import checkRateLimit from "../block/checkRateLimiting.js";
import { addOtpToHistory, checkOtpHistory } from "./addOtpToHistory.js";
import { otpGenerator } from "./otpGenerator.js";

export async function generateAndStoreOtp(user_id: string, ip: string, digits: number) {

    // Check for rate limit
    const { isAllowed, timeToReset } = await checkRateLimit(ip);
    if (!isAllowed) {
        throw new Error(`Rate limit exceeded. Try again in ${timeToReset} seconds.`);
    }

    // Check for user block status
    const userBlockStatus = await isUserBlocked(user_id);
    if (userBlockStatus.isBlocked) {
        throw new Error(`User is temporarily blocked. Try again in ${userBlockStatus.timeToUnblock} seconds`);
    }

    // Generate new otp
    const otp = otpGenerator(digits);

    // Check otp history
    const isOtpRecentlyUsed = await checkOtpHistory(user_id, otp.toString());
    if (isOtpRecentlyUsed) {
        while (await checkOtpHistory(user_id, otp.toString())) {
            otpGenerator(digits);
        }
    }
    
    if (!user_id) {
        throw new Error('Invalid user_id');
    }

    // Store OTP in Redis
    const otpKey = `otp:${user_id}`;
    
    const hashFields = {
        otp: otp.toString(),
        attempts: '0',
        created_at: Date.now().toString()
    }

    const otpExists = await redisClient.HGET(otpKey, 'otp');

    if (otpExists) {
        throw new Error(`An active OTP for user ${user_id} already exists.`);
    }
    
    try {
        // Pipeline transaction to ensure atomicity
        const pipeline = redisClient.multi();
        await pipeline
            .hSet(otpKey, hashFields)
            .expire(otpKey, parseInt(process.env.OTP_EXPIRY_TIME || '120', 10))
            .exec();

        addOtpToHistory(user_id, otp.toString());

    } catch (error) {
        throw new Error(`Failed to store OTP: ${(error as Error).message}`);
    }

    return await redisClient.hGet(otpKey, 'otp');
    
}