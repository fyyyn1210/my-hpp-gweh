import { logger } from "#src/configs/pino.config.js";

interface faultPayload {
    cause?: string | null;
    code?: number;
    data?: any;
    message?: string | null;
}

export interface FormatResponsePayload<T> {
    data: T;
    message?: string | null;
    cause?: string;
    success?: boolean;
}

export interface SuccessResponse<T> {
    success: true;
    data: T;
    message: string | null;
    timestamp: string;
}

export function response<T>({
    data,
    message = null,
    success = true,
    cause,
}: FormatResponsePayload<T>): SuccessResponse<T> {
    return {
        success,
        data,
        message,
        ...(!!cause ? { cause } : {}),
        timestamp: new Date().toISOString(),
    } as SuccessResponse<T>;
}

export class FaultError extends Error {
    code: number;
    data: any;

    constructor(message: string, code: number, data: any = null) {
        super(message);
        this.code = code;
        this.data = data;
    }
}

export const fault = ({
    code = 400,
    message = "UNKNOWN_ERROR",
    cause = null,
    data,
}: faultPayload) => {
    logger.error({ code, message, cause, data });

    let errData: any = null;
    if (cause) errData = { cause, ...data };
    else if (data !== undefined) errData = Array.isArray(data) ? data : [data];

    return new FaultError(message ?? "UNKNOWN_ERROR", code, errData);
};

export default response;
