import { t } from "elysia";

export const ISO_DATETIME_OFFSET_PATTERN = "^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$";

export const dateTimeSchema = t.String({ pattern: ISO_DATETIME_OFFSET_PATTERN });
