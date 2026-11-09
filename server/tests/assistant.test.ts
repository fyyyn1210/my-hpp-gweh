import { afterAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "#src/configs/database.config.js";
import { assistantUsage } from "#src/drizzle/schemas/index.js";
import { isGrounded, numbersIn } from "#src/modules/assistant/assistant.guard.js";
import { app } from "#src/index.js";

const replies: unknown[] = [];
let calls = 0;
const llm = Bun.serve({
    port: Number(new URL(process.env.AI_ENGINE_BASEURL!).port),
    fetch: () => {
        calls++;
        const next = replies.shift();
        return next === undefined ? new Response("down", { status: 500 }) : Response.json(next);
    },
});
afterAll(() => llm.stop());

const toolCall = (name: string, args: object) => ({
    choices: [{ message: { content: null, tool_calls: [{ id: `call-${calls}`, type: "function", function: { name, arguments: JSON.stringify(args) } }] } }],
    usage: { total_tokens: 100 },
});
const say = (content: string) => ({ choices: [{ message: { content } }], usage: { total_tokens: 50 } });

const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await app.handle(new Request(`http://test/api/v1${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
    }));
    return { status: res.status, json: await res.json() as any };
};

let token = "";
let userId = "";
let menuId = "";
const ask = (text: string) => call("POST", "/assistant/messages", { text }, token);

describe("assistant", () => {
    test("number guard", () => {
        expect(numbersIn("Rp 21.000, 30%, 2 kilo, 1,5 juta").map((item) => item.value)).toEqual([21000, 30, 2, 1500000]);
        expect(isGrounded("Untung tinggal 19% dari Rp 12.000", [{ profitNow: 0.192, sellPrice: 12000 }])).toBe(true);
        expect(isGrounded("Modalnya Rp 9.999", [{ costNow: 5000 }])).toBe(false);
        expect(isGrounded("Harganya turun 1,2% minggu ini", [{ change7Days: -0.012 }])).toBe(true);
        expect(isGrounded("Bahannya apa? Contoh: 150 gram ayam, 200 gr nasi", [])).toBe(true);
        expect(isGrounded("Modalnya 150 ribu", [])).toBe(false);
    });

    test("setup user with one menu", async () => {
        const session = await call("POST", "/auth/register", { name: "Asisten", email: `asisten-${Date.now()}@warung.test`, password: "rahasia1", city: "Bandung", shareCommunity: false });
        token = session.json.data.accessToken;
        userId = session.json.data.user.id;
        const menu = await call("POST", "/menus", {
            name: "Nasi Ayam", icon: "chicken", sellPrice: 15000, targetMargin: 0.3, threshold: 0.2, extraCost: 1000,
            ingredients: [{ name: "Ayam", icon: "chicken", qty: 100, unit: "gram", commodityId: "ayam", manualPricePerKg: null }],
        }, token);
        menuId = menu.json.data.id;
    });

    test("tool call returns card and keeps grounded text", async () => {
        replies.push(toolCall("menu_status", { menu: "nasi ayam" }), say("**Untung** Nasi Ayam masih aman."));
        const res = await ask("kenapa untung nasi ayam turun");
        expect(res.status).toBe(200);
        expect(res.json.data.cards).toEqual([{ kind: "status", menuId }]);
        expect(res.json.data.text).toBe("Untung Nasi Ayam masih aman.");
    });

    test("invented numbers are replaced, repeat question hits cache", async () => {
        replies.push(toolCall("menu_status", { menu: "nasi ayam" }), say("Untungnya 87% dan modal Rp 999.999"));
        const first = await ask("untung nasi ayam berapa");
        expect(first.json.data.text.startsWith("Untung Nasi Ayam sekarang")).toBe(true);
        const before = calls;
        const again = await ask("Untung  nasi ayam berapa");
        expect(calls).toBe(before);
        expect(again.json.data).toEqual(first.json.data);
    });

    test("missing argument asks back with choices, follow-up skips cache", async () => {
        replies.push(toolCall("catering_quote", { menu: "nasi ayam" }));
        const asked = await ask("ada pesanan nasi ayam");
        expect(asked.json.data.ask).toBe(true);
        expect(asked.json.data.choices.length).toBe(4);
        replies.push(toolCall("catering_quote", { menu: "nasi ayam", portions: 100, days_ahead: 14 }), say("Ini hitungannya."));
        const quoted = await ask(asked.json.data.choices[1].text);
        expect(quoted.json.data.cards[0]).toEqual({ kind: "quote", menuId, portions: 100, daysAhead: 14, margin: 0.3 });
    });

    test("stream sends status steps then reply", async () => {
        replies.push(toolCall("ingredient_price", { ingredient: "ayam" }), say("Ini harga ayam."));
        const res = await app.handle(new Request("http://test/api/v1/assistant/messages/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: "http://localhost:5173", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ text: "harga ayam sekarang" }),
        }));
        expect(res.headers.get("content-type")).toContain("text/event-stream");
        expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
        const events = (await res.text()).trim().split("\n\n").map((part) => ({
            event: part.match(/^event: (.*)$/m)![1],
            data: JSON.parse(part.match(/^data: (.*)$/m)![1]),
        }));
        expect(events.map((item) => item.event)).toEqual(["status", "status", "status", "reply"]);
        expect(events[1].data).toEqual({ text: "Mengecek harga bahan...", card: "price" });
        expect(events[3].data.cards[0].kind).toBe("price");
    });

    test("session history and reset", async () => {
        const history = await call("GET", "/assistant/messages", undefined, token);
        expect(history.json.data.length).toBe(12);
        expect(history.json.data.at(-1).cards[0].kind).toBe("price");
        const sessions = await call("GET", "/assistant/sessions", undefined, token);
        expect(sessions.json.data.length).toBe(1);
        expect(sessions.json.data[0].title).toBe("kenapa untung nasi ayam turun");
        expect(sessions.json.data[0].questions).toBe(6);
        expect((await call("GET", `/assistant/sessions/${sessions.json.data[0].id}`, undefined, token)).json.data.length).toBe(12);
        expect((await call("GET", `/assistant/sessions/${crypto.randomUUID()}`, undefined, token)).status).toBe(404);
        await call("POST", "/assistant/reset", undefined, token);
        expect((await call("GET", "/assistant/messages", undefined, token)).json.data.length).toBe(0);
    });

    test("menu drafts add, change and delete without saving", async () => {
        replies.push(toolCall("draft_new_menu", { name: "Ayam Telur", recipe: "100 gram ayam\n2 butir telur" }), say("Cek dulu ya."));
        const created = (await ask("tambah menu ayam telur: 100 gram ayam, 2 butir telur")).json.data.cards[0];
        expect(created.kind).toBe("menu_draft");
        expect(created.menuId).toBeNull();
        expect(created.menu.ingredients.map((item: any) => [item.qty, item.unit, item.commodityId])).toEqual([[100, "gram", "ayam"], [2, "butir", expect.any(String)]]);
        expect(created.menu.sellPrice).toBeGreaterThan(0);

        replies.push(
            toolCall("draft_new_menu", { name: "Ayam Geprek", recipe: "150 gram ayam\n1 porsi beras medium", recipe_is_suggestion: true }),
            toolCall("draft_new_menu", { name: "Ayam Geprek", recipe: "150 gram ayam\n1 butir telur", recipe_is_suggestion: true }),
            say("Ini saran bahannya."),
        );
        const suggestedCards = (await ask("buatkan menu ayam geprek")).json.data.cards;
        expect(suggestedCards.length).toBe(1);
        const suggested = suggestedCards[0];
        expect(suggested.suggested).toBe(true);
        expect(suggested.menu.ingredients.map((item: any) => item.unit)).toEqual(["gram", "butir"]);

        replies.push(toolCall("draft_new_menu", { name: "Pecel Lele", recipe: "tempe\nayam", recipe_is_batch: true }));
        const unknownPortion = (await ask("saya dagang pecel lele, ke pasar beli tempe, ayam dll, tapi tak tahu seporsinya berapa")).json.data;
        expect(unknownPortion.ask).toBe(true);
        expect(unknownPortion.text).toContain("jadi berapa porsi?");
        expect(unknownPortion.text).toContain("dijual berapa?");

        replies.push(toolCall("draft_new_menu", { name: "Pecel Lele", recipe: "2 kg lele\n10 butir telur", batch_portions: 20, sell_price: 12000 }), say("Ini takaran per porsinya."));
        const batch = (await ask("2 kg lele dan 10 butir telur, jadi 20 porsi, dijual 12000")).json.data.cards[0];
        expect(batch.batch).toBe(20);
        expect(batch.menu.sellPrice).toBe(12000);

        replies.push(toolCall("draft_new_menu", { name: "nasi ayam", recipe: "100 gram ayam" }));
        expect((await ask("tambah menu nasi ayam")).json.data.choices[0].label).toBe("Ubah Nasi Ayam");
        expect(batch.menu.ingredients.map((item: any) => [item.qty, item.unit])).toEqual([[100, "gram"], [0.5, "butir"]]);

        replies.push(toolCall("draft_menu_change", { menu: "nasi ayam", set_ingredients: "150 gram ayam\n1 butir telur", extra_cost: 2000 }), say("Cek dulu ya."));
        const changed = (await ask("nasi ayam pakai 150 gram ayam, tambah 1 butir telur, biaya lain 2000")).json.data.cards[0];
        expect(changed).toMatchObject({ kind: "menu_draft", menuId, menu: { name: "Nasi Ayam", extraCost: 2000, sellPrice: 15000 } });
        expect(changed.menu.ingredients.map((item: any) => item.qty)).toEqual([150, 1]);

        replies.push(toolCall("draft_menu_change", { menu: "nasi ayam" }));
        expect((await ask("ubah nasi ayam")).json.data.ask).toBe(true);

        replies.push(toolCall("draft_menu_delete", { menu: "nasi ayam" }), say("Tekan Hapus kalau yakin."));
        expect((await ask("hapus menu nasi ayam")).json.data.cards[0]).toEqual({ kind: "menu_delete", menuId, name: "Nasi Ayam" });

        const menus = (await call("GET", "/menus", undefined, token)).json.data;
        expect(menus.length).toBe(1);
        expect(menus[0].ingredients[0].qty).toBe(100);
    });

    test("provider down returns AI_UNAVAILABLE", async () => {
        const res = await ask("halo");
        expect(res.status).toBe(503);
        expect(res.json.message).toBe("AI_UNAVAILABLE");
    });

    test("daily limit", async () => {
        await db.update(assistantUsage).set({ messages: 50 }).where(eq(assistantUsage.userId, userId));
        const res = await ask("menu apa yang paling bahaya");
        expect(res.status).toBe(429);
        expect(res.json.message).toBe("AI_LIMIT_REACHED");
    });
});
