import { TOOL_DEFINITIONS } from "#src/modules/assistant/assistant.tools.js";
import { callModel, MODELS, VISION_MODELS, type LlmMessage } from "#src/modules/assistant/llm.provider.js";
import { ToolName } from "#src/utils/assistant.constant.js";

const vision = process.argv.includes("--vision");
const named = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const models = named.length ? named : vision ? [...new Set([...VISION_MODELS, ...MODELS])] : MODELS;
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const messages: LlmMessage[] = vision
    ? [{ role: "user", content: [{ type: "text", text: "Describe this image in 5 words." }, { type: "image_url", image_url: { url: PIXEL } }] }]
    : [
        { role: "system", content: "You help Indonesian food stall owners. Always use a tool for questions about menus." },
        { role: "user", content: "kenapa untung ayam geprek turun?" },
    ];

for (const model of models) {
    const started = Date.now();
    try {
        const answer = await callModel(model, messages, vision ? undefined : TOOL_DEFINITIONS, 30_000);
        const tool = answer.toolCalls[0]?.function;
        const ok = vision || tool?.name === ToolName.MenuStatus;
        console.log(`${ok ? "OK  " : "MISS"} ${model} ${Date.now() - started}ms ${tool ? `${tool.name} ${tool.arguments}` : `text: ${answer.content?.slice(0, 60)}`}`);
    } catch (err) {
        console.log(`FAIL ${model} ${Date.now() - started}ms ${String(err)}`);
    }
}
