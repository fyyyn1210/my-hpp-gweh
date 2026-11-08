import type { Context } from 'elysia';
import type { Static, TSchema } from '@sinclair/typebox';

type UnwrapSchema<T> = T extends TSchema ? Static<T> : unknown;

export type InferContext<T extends Record<string, any>> = Context<{
    body: UnwrapSchema<T['body']>;
    params: UnwrapSchema<T['params']>;
    query: UnwrapSchema<T['query']>;
    headers: UnwrapSchema<T['headers']>;
    response: UnwrapSchema<T['response']>;
}>;
