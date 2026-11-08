import { Elysia, t } from "elysia";
import db from "#src/configs/database.config.js";
import { commodities } from "#src/drizzle/schemas/index.js";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { parseRecipeText } from "#src/modules/recipes/recipe.parser.js";
import response from "#src/utils/response.util.js";

export const recipeController = new Elysia({ prefix: "/recipes", detail: { tags: ["Recipes"] } })
    .use(authMiddleware)
    .post("/parse", async ({ body }) => {
        const items = await db.select({ id: commodities.id, name: commodities.name, icon: commodities.icon, aliases: commodities.aliases }).from(commodities);
        return response({ data: parseRecipeText(body.text, items) });
    }, { body: t.Object({ text: t.String({ minLength: 1, maxLength: 4000 }) }) });
