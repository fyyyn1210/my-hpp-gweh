import { t } from "elysia";

export interface RequestSchema {
    body?: any;
    params?: any;
    query?: any;
    type?: string;
    detail?: any;
}

export interface ResponseSchema {
    response?: {
        200?: any;
        [key: number]: any;
    };
}

export interface ApiSchema extends RequestSchema, ResponseSchema { }

export const tResponse = (dataSchema: any) => t.Object({
    success: t.Literal(true),
    data: dataSchema,
    message: t.Nullable(t.String()),
    timestamp: t.String(),
});
