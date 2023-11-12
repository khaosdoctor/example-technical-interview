import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { z } from 'zod';
import {
    UserCreationSchema,
    UserRepository,
    UserSchema,
    UserUpdateSchema,
} from '../data/UserRepository.js';
import { UserService } from '../service/UserService.js';
import { AppConfig } from '../config.js';

const listQuerySchema = z.object({
    created: z.any().optional(),
    page: z.number({ coerce: true }).optional().default(1),
    limit: z.number({ coerce: true }).optional().default(10),
});

const errorBoundary =
    <R = Request, RS = Response>(fn: (req: R, res: RS, next: NextFunction) => Promise<void>) =>
    async (req: R, res: RS, next: NextFunction) => {
        return fn(req, res, next).catch((error) => next(error));
    };

export function userRouter(service: UserService, config: AppConfig) {
    const logger = config.logger.extend('perspective:presentation:routes:user');
    logger('Creating user router with user service %O', service);

    const router = Router();

    router.post(
        '/',
        errorBoundary(async (req, res) => {
            const user = UserCreationSchema.parse(req.body);
            const result = await service.createUser(user);
            res.json(result).status(201);
        }),
    );

    router.get(
        '/:id',
        errorBoundary(async (req, res) => {
            // pick a valid UUID from the user schema and parse it
            const { id } = UserSchema.pick({ id: true }).parse({ id: req.params.id });
            const result = await service.findById(id);
            res.json(result).status(200);
        }),
    );

    router.delete(
        '/:id',
        errorBoundary(async (req, res) => {
            // pick a valid UUID from the user schema and parse it
            const { id } = UserSchema.pick({ id: true }).parse({ id: req.params.id });
            await service.deleteUser(id);
            res.status(204).end();
        }),
    );

    router.patch(
        '/:id',
        errorBoundary(async (req, res) => {
            // pick a valid UUID from the user schema and parse it
            const { id } = UserSchema.pick({ id: true }).parse({ id: req.params.id });
            const user = UserUpdateSchema.parse(req.body);
            const result = await service.updateUser(id, user);
            res.json(result).status(200);
        }),
    );

    router.get(
        '/',
        errorBoundary(
            async (
                req: Request<
                    never,
                    Awaited<ReturnType<UserRepository['list']>>,
                    never,
                    { created?: string; page?: string; limit?: string }
                >,
                res,
            ) => {
                const query = listQuerySchema.parse(req.query);
                const results = await service.listUsers(query.page, query.limit);
                res.set('X-Range', `${results.from}-${results.to}/${results.total}`);
                res.set('X-Current-Page', String(results.page));
                res.json(results).status(200);
            },
        ),
    );

    return router;
}
