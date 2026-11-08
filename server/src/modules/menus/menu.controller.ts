import { Elysia } from "elysia";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { createMenuSchema, menuIdSchema, updateMenuSchema } from "#src/modules/menus/menu.schema.js";
import { createMenu, deleteMenu, getMenu, listMenus, updateMenu } from "#src/modules/menus/menu.service.js";
import response from "#src/utils/response.util.js";

export const menuController = new Elysia({ prefix: "/menus", detail: { tags: ["Menus"] } })
    .use(authMiddleware)
    .get("/", async ({ userId }) => response({ data: await listMenus(userId) }))
    .get("/:id", async ({ userId, params }) => response({ data: await getMenu(userId, params.id) }), menuIdSchema)
    .post("/", async ({ userId, body, status }) => status("Created", response({ message: "MENU_CREATED", data: await createMenu(userId, body) })), createMenuSchema)
    .patch("/:id", async ({ userId, params, body }) => response({ message: "MENU_UPDATED", data: await updateMenu(userId, params.id, body) }), updateMenuSchema)
    .delete("/:id", async ({ userId, params }) => {
        await deleteMenu(userId, params.id);
        return response({ message: "MENU_DELETED", data: null });
    }, menuIdSchema);
