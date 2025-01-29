import express, { Request, Response } from "express";
import redisClient from "./config/redisConfig.js";
import checkRateLimit from "./utils/block/checkRateLimiting.js";
import { otpVerification } from "./utils/otp/otpVerification.js";
import { generateAndStoreOtp } from "./utils/otp/generateAndStoreOTP.js";


const app = express();
app.use(express.json());

app.set('trust proxy', true);

// Helper function to get client IP
const getClientIP = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};

app.get('/', (req: Request, res: Response) => {
    res.status(200).send('Hello, World!');
})

// Route to generate OTP
app.post('/api/otp/generate', async (req: Request, res: Response) => {
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
app.post('/api/otp/verify', async (req: Request, res: Response) => {
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
app.get('/api/otp/status/:phone_number', async (req: Request, res: Response) => {
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
app.get('/api/otp/ratelimit', async (req: Request, res: Response) => {
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

// Redis Connection
await redisClient.connect();
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Start server
const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;