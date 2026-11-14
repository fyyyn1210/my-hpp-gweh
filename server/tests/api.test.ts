import { describe, expect, test } from "bun:test";
import { app } from "#src/index.js";

const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const res = await app.handle(new Request(`http://test/api/v1${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
    }));
    return { status: res.status, json: await res.json() as any };
};

const email = `tes-${Date.now()}@warung.test`;
let access = "";
let refresh = "";
let other = "";

describe("api", () => {
    test("register starts empty and rejects duplicates", async () => {
        const res = await call("POST", "/auth/register", { name: "Tes", email: email.toUpperCase(), password: "rahasia1", city: "Bandung", shareCommunity: true });
        expect(res.status).toBe(201);
        expect(res.json.data.user.email).toBe(email);
        expect(res.json.data.user.passwordHash).toBeUndefined();
        expect((await call("GET", "/menus", undefined, res.json.data.accessToken)).json.data.length).toBe(0);
        expect((await call("GET", "/notas", undefined, res.json.data.accessToken)).json.data.length).toBe(0);
        access = res.json.data.accessToken;
        refresh = res.json.data.refreshToken;
        const again = await call("POST", "/auth/register", { name: "Tes", email, password: "rahasia1", city: "Bandung", shareCommunity: true });
        expect(again.status).toBe(409);
        expect(again.json.message).toBe("EMAIL_TAKEN");
        other = (await call("POST", "/auth/register", { name: "Lain", email: `lain-${Date.now()}@warung.test`, password: "rahasia1", city: "Surabaya", shareCommunity: true })).json.data.accessToken;
    });

    test("login, wrong password, refresh and guard", async () => {
        expect((await call("POST", "/auth/login", { email, password: "salah123" })).json.message).toBe("INVALID_CREDENTIALS");
        expect((await call("POST", "/auth/login", { email, password: "rahasia1" })).status).toBe(200);
        expect((await call("GET", "/menus")).status).toBe(401);
        expect((await call("GET", "/menus", undefined, refresh)).status).toBe(401);
        const renewed = await call("POST", "/auth/refresh", { refreshToken: refresh });
        expect(renewed.status).toBe(200);
        expect((await call("POST", "/auth/refresh", { refreshToken: access })).status).toBe(401);
    });

    test("profile, commodities and alerts", async () => {
        const patched = await call("PATCH", "/me", { roundingStep: 1000, city: "Surabaya" }, access);
        expect(patched.json.data.roundingStep).toBe(1000);
        expect((await call("PATCH", "/me", { roundingStep: 700 }, access)).status).toBe(422);
        const commodities = await call("GET", "/commodities", undefined, access);
        expect(commodities.json.data.length).toBe(10);
        expect(commodities.json.data[0].prices.length).toBe(120);
        expect((await call("GET", "/alerts", undefined, access)).json.data.length).toBe(0);
        await call("POST", "/menus", {
            name: "Ayam Rugi", icon: "chicken", sellPrice: 1000, targetMargin: 0.3, threshold: 0.2, extraCost: 0,
            ingredients: [{ name: "Ayam", icon: "chicken", qty: 200, unit: "gram", commodityId: "ayam", manualPricePerKg: null }],
        }, access);
        const alerts = await call("GET", "/alerts", undefined, access);
        expect(alerts.json.data.length).toBeGreaterThan(0);
        await call("POST", "/alerts/read", { ids: [alerts.json.data[0].id] }, access);
        expect((await call("GET", "/alerts", undefined, access)).json.data[0].read).toBe(true);
    });

    test("menu crud", async () => {
        const list = await call("GET", "/menus", undefined, access);
        expect(list.json.data.length).toBe(1);
        expect(list.json.data[0].name).toBe("Ayam Rugi");
        const created = await call("POST", "/menus", {
            name: "Nasi Ayam", icon: "chicken", sellPrice: 15000, targetMargin: 0.3, threshold: 0.2, extraCost: 1000,
            ingredients: [{ name: "Ayam", icon: "chicken", qty: 100, unit: "gram", commodityId: "ayam", manualPricePerKg: null }],
        }, access);
        expect(created.status).toBe(201);
        const id = created.json.data.id;
        expect((await call("POST", "/menus", { ...created.json.data, ingredients: [{ name: "X", icon: "dish", qty: 1, unit: "gram", commodityId: "nope", manualPricePerKg: null }] }, access)).status).toBe(422);
        const updated = await call("PATCH", `/menus/${id}`, { sellPrice: 17000, resetPriceDate: true, ingredients: [] }, access);
        expect(updated.json.data.sellPrice).toBe(17000);
        expect(updated.json.data.ingredients.length).toBe(0);
        expect((await call("DELETE", `/menus/${id}`, undefined, access)).status).toBe(200);
        expect((await call("GET", `/menus/${id}`, undefined, access)).status).toBe(404);
    });

    test("notas, community and recipe parser", async () => {
        const nota = await call("POST", "/notas", { commodityId: "cabai-rawit", pricePerKg: 80000, shared: true }, access);
        expect(nota.status).toBe(201);
        const votes = await call("GET", "/commodities/community", undefined, other);
        expect(votes.json.data.some((vote: any) => vote.pricePerKg === 80000)).toBe(true);
        expect((await call("DELETE", `/notas/${nota.json.data.id}`, undefined, other)).status).toBe(404);
        expect((await call("DELETE", `/notas/${nota.json.data.id}`, undefined, access)).status).toBe(200);
        const parsed = await call("POST", "/recipes/parse", { text: "150 gram daging ayam\n2 sdm kecap" }, access);
        expect(parsed.json.data[0].commodityId).toBe("ayam");
        expect(parsed.json.data[1].manualPricePerKg).toBe(25000);
    });
});
