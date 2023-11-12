import { z } from 'zod';
import debug from 'debug';
const baseLogger = debug('perspective');

baseLogger.extend('config')('Loading configuration');
export const AppConfigSchema = z.object({
    PORT: z
        .string()
        .optional()
        .default('3000')
        .transform((value) => Number(value))
        .refine((port) => port >= 0 && port <= 65535, {
            message: 'PORT must be between 0 and 65535',
        }),
    MONGODB_URI: z.string().optional().default('mongodb://localhost:27017/perspective'),
    MONGODB_DBNAME: z.string().optional().default('perspective'),
});

export type AppConfig = z.infer<typeof AppConfigSchema> & { logger: typeof baseLogger };
export const appConfig: AppConfig = { ...AppConfigSchema.parse(process.env), logger: baseLogger };
