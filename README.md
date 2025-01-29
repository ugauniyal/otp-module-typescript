# OTP-Module-Typescript
A robust, secure, and highly configurable OTP (One-Time Password) management module built with TypeScript and Redis. This module provides rate limiting, user blocking, and OTP history tracking out of the box. Use this in your project however you want and connect it with the SMS Gateway Providers of your choice. 


## Features

- 🔒 Secure OTP generation and verification
- ⚡ Redis-based storage for optimal performance
- 🚥 Built-in rate limiting by IP and user
- 🕒 Configurable OTP expiry
- 🔄 OTP history tracking to prevent reuse
- 🛡️ Protection against brute force attacks
- 📊 Attempt tracking and management
- 🌐 Easy integration with any Node.js application

## Installation

Just copy this module in any of your project and integrate according to your needs.

Integrate your OTP module in your project with the SMS Gateway Providers of your choice.

## Prerequisites

- Node.js (version 14 or higher)
- Redis (version 6.0 or higher)
- TypeScript (version 4.5 or higher)

## Quick Start

1. Configure Redis connection:

```typescript
// config/redisConfig.ts
import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

export default redisClient;
```

2. Generate OTP:

```typescript
import { storeOtp } from 'redis-otp-module';

const generateOTP = async (phoneNumber: string, ip: string) => {
    try {
        const otp = await storeOtp(phoneNumber, 123456, ip);
        return otp;
    } catch (error) {
        console.error('OTP generation failed:', error);
        throw error;
    }
};
```

3. Verify OTP:

```typescript
import { otpVerification } from 'redis-otp-module';

const verifyOTP = async (phoneNumber: string, otp: string, ip: string) => {
    try {
        const result = await otpVerification(phoneNumber, otp, ip);
        return result === 1; // 1: success, 0: invalid, -1: max attempts exceeded
    } catch (error) {
        console.error('OTP verification failed:', error);
        throw error;
    }
};
```

## API Reference (Example)

##### 1. `storeOtp(identifier: string, otp: number, ip: string): Promise<string | null>`

Generates and stores a new OTP.

#### **Parameters**
| Parameter  | Type     | Description                                   |
|------------|---------|-----------------------------------------------|
| `identifier` | `string` | Unique user identifier (e.g., phone, email). |
| `otp`       | `number` | The OTP to store. |
| `ip`        | `string` | Client IP address for rate limiting. |

#### **Returns**
- `Promise<string | null>`  
  - Returns a success message or `null` if storing fails.

---

#### 2. `otpVerification(identifier: string, otp: string, ip: string): Promise<-1 | 0 | 1>`

Verifies an OTP.

#### **Parameters**
| Parameter  | Type     | Description                                   |
|------------|---------|-----------------------------------------------|
| `identifier` | `string` | Unique user identifier. |
| `otp`       | `string` | The OTP to verify. |
| `ip`        | `string` | Client IP address. |

#### **Returns**
- `Promise<-1 | 0 | 1>`  
  - `1`: ✅ Verification successful  
  - `0`: ❌ Invalid OTP  
  - `-1`: 🚫 Maximum attempts exceeded  

---

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.


## License
MIT


## Support
For support or feature requests, please open an issue in the GitHub repository.