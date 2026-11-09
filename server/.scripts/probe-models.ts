import { TOOL_DEFINITIONS } from "#src/modules/assistant/assistant.tools.js";
import { callModel, MODELS } from "#src/modules/assistant/llm.provider.js";
import { ToolName } from "#src/utils/assistant.constant.js";

const models = process.argv.slice(2).length ? process.argv.slice(2) : MODELS;
const messages = [
    { role: "system" as const, content: "You help Indonesian food stall owners. Always use a tool for questions about menus." },
    { role: "user" as const, content: "kenapa untung ayam geprek turun?" },
];

for (const model of models) {
    const started = Date.now();
    try {
        const answer = await callModel(model, messages, TOOL_DEFINITIONS, 30_000);
        const tool = answer.toolCalls[0]?.function;
        const ok = tool?.name === ToolName.MenuStatus;
        console.log(`${ok ? "OK  " : "MISS"} ${model} ${Date.now() - started}ms ${tool ? `${tool.name} ${tool.arguments}` : `text: ${answer.content?.slice(0, 60)}`}`);
    } catch (err) {
        console.log(`FAIL ${model} ${Date.now() - started}ms ${String(err)}`);
    }
}
