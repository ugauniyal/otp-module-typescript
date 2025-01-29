import redisClient from "../../config/redisConfig.js";
import { OTPHistoryConfig } from "../../types.js";


// OTP Config for history
const OTP_CONFIG = {
    HISTORY: {
        MAX_HISTORY_SIZE: parseInt(process.env.MAX_OTP_HISTORY || '10'),
        HISTORY_EXPIRY_DAYS: parseInt(process.env.HISTORY_EXPIRY_DAYS || '7')
    } as OTPHistoryConfig,
    EXPIRY_TIME: parseInt(process.env.OTP_EXPIRY_TIME || '120', 10)
};


export async function addOtpToHistory(user_id:string, otp: string) {
    const historyKey = `otp:history:${user_id}`;
    const now = Date.now().toString();
    
    try {
        // Add OTP to history using redis list to ensure a limited size
        await redisClient
            .multi()
            .lPush(historyKey, JSON.stringify({ otp, timestamp: now }))
            .lTrim(historyKey, 0, OTP_CONFIG.HISTORY.MAX_HISTORY_SIZE - 1)
            .expire(historyKey, OTP_CONFIG.HISTORY.HISTORY_EXPIRY_DAYS * 24 * 60 * 60)
            .exec();
    } catch (error) {
        console.error('Failed to add OTP to history:', error);
    }
    
}

export async function checkOtpHistory(user_id: string, otp: string): Promise<boolean> {
    const historyKey = `otp:history:${user_id}`;
    
    try {
        const history = await redisClient.lRange(historyKey, 0, -1);
        return history.some(item => {
            const parsed = JSON.parse(item);
            return parsed.otp === otp;
        });
    } catch (error) {
        console.error('Failed to check OTP history:', error);
        return false;
    }
}