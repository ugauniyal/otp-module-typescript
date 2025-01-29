export type RateLimitResponse = {
    isAllowed: boolean;
    timeToReset?: number;
};

export type BlockStatus = {
    isBlocked: boolean;
    timeToUnblock?: number;
};

export type OTPHistoryConfig = {
    MAX_HISTORY_SIZE: number;
    HISTORY_EXPIRY_DAYS: number;
}