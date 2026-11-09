import env from "#src/configs/env.config.js";
import { logger } from "#src/configs/pino.config.js";
import {
    BAD_REQUEST_COOLDOWN_MS,
    LLM_BUDGET_MS,
    LLM_TEMPERATURE,
    LLM_TIMEOUT_MS,
    MODEL_COOLDOWN_MS,
    QUOTA_COOLDOWN_MS,
    QUOTA_STATUSES,
} from "#src/utils/assistant.constant.js";
import { fault } from "#src/utils/response.util.js";

export interface ToolCall {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
}

export type LlmMessage =
    | { role: "system" | "user"; content: string }
    | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
    | { role: "tool"; tool_call_id: string; content: string };

export interface ToolDefinition {
    type: "function";
    function: { name: string; description: string; parameters: Record<string, unknown> };
}

interface Completion {
    choices?: Array<{ message?: { content?: string | null; tool_calls?: ToolCall[] } }>;
    usage?: { total_tokens?: number };
}

class LlmError extends Error {
    constructor(readonly status: number, readonly retryAfterMs: number | null = null) {
        super(`HTTP ${status}`);
    }
}

const ENDPOINT = `${env.AI_ENGINE_BASEURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1/chat/completions`;
export const MODELS = [env.AI_ENGINE_MODEL, ...env.AI_ENGINE_FALLBACK_MODELS.split(",").map((model) => model.trim()).filter(Boolean)];

const coolingUntil = new Map<string, number>();

const cooldownOf = (err: unknown) => {
    if (!(err instanceof LlmError)) return MODEL_COOLDOWN_MS;
    if (QUOTA_STATUSES.includes(err.status)) return err.retryAfterMs ?? QUOTA_COOLDOWN_MS;
    if (err.status === 400) return BAD_REQUEST_COOLDOWN_MS;
    return MODEL_COOLDOWN_MS;
};

export const callModel = async (model: string, messages: LlmMessage[], tools?: ToolDefinition[], timeoutMs = LLM_TIMEOUT_MS) => {
    const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.AI_ENGINE_APIKEY}` },
        body: JSON.stringify({ model, messages, temperature: LLM_TEMPERATURE, ...(tools && { tools, tool_choice: "auto" }) }),
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
        const retryAfter = Number(res.headers.get("retry-after"));
        throw new LlmError(res.status, retryAfter > 0 ? retryAfter * 1000 : null);
    }
    const json = (await res.json()) as Completion;
    const message = json.choices?.[0]?.message;
    if (!message) throw new Error("Empty completion");
    return { model, content: message.content ?? null, toolCalls: message.tool_calls ?? [], tokens: json.usage?.total_tokens ?? 0 };
};

export const complete = async (messages: LlmMessage[], tools?: ToolDefinition[]) => {
    const deadline = Date.now() + LLM_BUDGET_MS;
    const ready = MODELS.filter((model) => (coolingUntil.get(model) ?? 0) <= Date.now());
    for (const model of ready.length ? ready : MODELS) {
        const left = deadline - Date.now();
        if (left <= 0) break;
        try {
            const answer = await callModel(model, messages, tools, Math.min(LLM_TIMEOUT_MS, left));
            coolingUntil.delete(model);
            return answer;
        } catch (err) {
            coolingUntil.set(model, Date.now() + cooldownOf(err));
            logger.warn({ model, err: String(err) }, "LLM call failed");
        }
    }
    throw fault({ code: 503, message: "AI_UNAVAILABLE", cause: "All LLM models failed" });
};
