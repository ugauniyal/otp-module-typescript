export function otpGenerator(digits: number): number {
    if (digits <= 0) 
        throw new Error("Digits must be a positive integer.");

    return Math.floor(Math.random() * (Math.pow(10, digits) - Math.pow(10, digits - 1))) + Math.pow(10, digits - 1);
}
