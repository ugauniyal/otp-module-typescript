import { Router } from "express";
import { Request, Response } from "express";
import redisClient from "../config/redisConfig.js";
import checkRateLimit from "../utils/ip/checkRateLimiting.js";
import { otpVerification } from "../utils/otp/otpVerification.js";
import { generateAndStoreOtp } from "../utils/otp/generateAndStoreOTP.js";
import { getClientIP } from "../utils/ip/getClientIP.js";

const router = Router();

// Route to generate OTP
router.post('/otp/generate', async (req: Request, res: Response) => {
    try {
        const { phone_number } = req.body;

        if (!phone_number) {
            res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
            return;
        }

        const ip = getClientIP(req);
        const otp = await generateAndStoreOtp(phone_number, ip, 4);

        res.status(200).json({
            success: true,
            message: 'OTP generated successfully',
            data: {
                phone_number,
                otp
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: (error as Error).message
        });
    }
});

// Route to verify OTP
router.post('/otp/verify', async (req: Request, res: Response) => {
    try {
        const { phone_number, otp } = req.body;

        if (!phone_number || !otp) {
            res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
            return;
        }

        const ip = getClientIP(req);
        const result = await otpVerification(phone_number, otp.toString(), ip);

        if (result === 1) {
            res.status(200).json({
                success: true,
                message: 'OTP verified successfully'
            });
        } else if (result === 0) {
            res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Maximum attempts exceeded'
            });
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: (error as Error).message
        });
    }
});

// Route to check OTP status
router.get('/otp/status/:phone_number', async (req: Request, res: Response) => {
    try {
        const { phone_number } = req.params;
        const otpKey = `otp:${phone_number}`;
        
        const [otp, attempts] = await Promise.all([
            redisClient.hGet(otpKey, 'otp'),
            redisClient.hGet(otpKey, 'attempts')
        ]);

        if (!otp) {
            res.status(404).json({
                success: false,
                message: 'No active OTP found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                has_active_otp: true,
                attempts: attempts || '0'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
});

// Route to check rate limit status
router.get('/otp/ratelimit', async (req: Request, res: Response) => {
    try {
        const ip = getClientIP(req);
        const { phone_number } = req.query;

        if (!phone_number) {
            res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
            return;
        }

        const { isAllowed, timeToReset } = await checkRateLimit(ip);

        res.status(200).json({
            success: true,
            data: {
                is_allowed: isAllowed,
                time_to_reset: timeToReset || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
});

export default router;