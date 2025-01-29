import redisClient from "../../config/redisConfig.js";
import { isUserBlocked } from "../block/checkIsUserBlocked.js";
import checkRateLimit from "../block/checkRateLimiting.js";
import { handleUserBlock } from "../block/handleUserBlock.js";

export async function otpVerification(user_id: string, otp: string, ip: string): Promise<-1 | 0 | 1> {
    try {
        // Check for rate limit
        if ((await checkRateLimit(ip)).isAllowed === false) {
            throw new Error('IP is temporarily blocked due to multiple failed attempts');
        }

        // Check for user block status
        const userBlockStatus = await isUserBlocked(user_id);
        if (userBlockStatus.isBlocked) {
            throw new Error(
                `User is temporarily blocked. Try again in ${userBlockStatus.timeToUnblock} seconds`
            );
        }
        
        const otpKey = `otp:${user_id}`;
        const MAX_ATTEMPTS = process.env.MAX_OTP_ATTEMPTS ? parseInt(process.env.MAX_OTP_ATTEMPTS) : 10;
        
        const [generatedOtp, attempts, created_at] = await Promise.all([
            redisClient.hGet(otpKey, 'otp'),
            redisClient.hGet(otpKey, 'attempts'),
            redisClient.hGet(otpKey, 'created_at')
        ]);

        if (!generatedOtp) {
            throw new Error('OTP not found or expired');
        }

        const currentAttempts = attempts ? parseInt(attempts) : 0;

        // Check for expired OTP
        if (created_at) {
            const elapsedTime = Date.now() - parseInt(created_at);
            if (elapsedTime > parseInt(process.env.OTP_EXPIRY_TIME || '120', 10) * 1000) {
                await redisClient.del(otpKey);
                throw new Error('OTP has expired');
            }
        }

        // Check for maximum attempts
        if (currentAttempts >= MAX_ATTEMPTS) {
            await redisClient.del(otpKey);
            handleUserBlock(user_id);
            return -1;
        }

        // Verify OTP
        if (generatedOtp === otp) {
            await redisClient.del(otpKey);
            return 1;
        }

        // Incorrect OTP, increment attempts
        await redisClient.hIncrBy(otpKey, 'attempts', 1);
        const remainingAttempts = MAX_ATTEMPTS - (currentAttempts + 1);
        console.log(
            `Failed OTP attempt for user ${user_id} from IP ${ip}. ` +
            `${remainingAttempts} attempts remaining.`
        );
        
        return 0;

    } catch (error) {
        console.error('OTP verification failed:', error);
        throw new Error(`OTP verification failed: ${(error as Error).message}`);
    }
}
