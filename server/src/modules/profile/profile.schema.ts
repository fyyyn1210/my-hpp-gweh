import { t } from "elysia";
import { CITIES, ROUNDING_STEPS } from "#src/utils/hpp.constant.js";

export const citySchema = t.UnionEnum(CITIES as [string, ...string[]]);

export const updateProfileSchema = {
    body: t.Partial(t.Object({
        name: t.String({ minLength: 1, maxLength: 60 }),
        city: citySchema,
        shareCommunity: t.Boolean(),
        roundingStep: t.Union(ROUNDING_STEPS.map((step) => t.Literal(step))),
        notifyInApp: t.Boolean(),
        notifyTelegram: t.Boolean(),
        notifyPush: t.Boolean(),
    })),
};
