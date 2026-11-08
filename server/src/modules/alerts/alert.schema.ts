import { t } from "elysia";

export const readAlertsSchema = { body: t.Object({ ids: t.Array(t.String({ minLength: 1, maxLength: 120 }), { maxItems: 200 }) }) };
