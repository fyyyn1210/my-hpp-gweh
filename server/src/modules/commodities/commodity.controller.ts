import { Elysia } from "elysia";
import { authMiddleware } from "#src/middlewares/auth.middleware.js";
import { communityVotes, listCommodities } from "#src/modules/commodities/commodity.service.js";
import { findUser } from "#src/modules/profile/profile.service.js";
import response from "#src/utils/response.util.js";
import { regionOfCity } from "#src/utils/hpp.constant.js";

export const commodityController = new Elysia({ prefix: "/commodities", detail: { tags: ["Commodities"] } })
    .use(authMiddleware)
    .get("/", async ({ userId }) => {
        const user = await findUser(userId);
        return response({ data: await listCommodities(regionOfCity(user.city)) });
    })
    .get("/community", async ({ userId }) => {
        const user = await findUser(userId);
        return response({ data: await communityVotes(user.id, user.city) });
    });
