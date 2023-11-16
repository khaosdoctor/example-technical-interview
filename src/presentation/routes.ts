import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { AppConfig } from '../config.js';
import {
    UserCreationSchema,
    UserRepository,
    UserSchema,
    UserUpdateSchema,
} from '../data/UserRepository.js';
import { UserService } from '../service/UserService.js';

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
            // Conflict checking was intentionally omitted to be easier to test
            // however it should be added in a real application like
            // existingUser = await service.findByEmail(user.email);
            // with the corresponding methods in the service and repository
            // Returning 409 Conflict if the user already exists
            const result = await service.createUser(user);
            res.status(201).json(result);
        }),
    );

    router.get(
        '/:id',
        errorBoundary(async (req, res) => {
            const result = await service.findById(req.params.id);
            res.json(result);
        }),
    );

    router.delete(
        '/:id',
        errorBoundary(async (req, res) => {
            await service.deleteUser(req.params.id);
            res.status(204).end();
        }),
    );

    router.patch(
        '/:id',
        errorBoundary(async (req, res) => {
            const user = UserUpdateSchema.parse(req.body);
            const result = await service.updateUser(req.params.id, user);
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
                const results = await service.listUsers(
                    query.page,
                    query.limit,
                    // You can extend this same interface to support all other sorts
                    // As the service backend is already prepared to handle it
                    req.query.created ? 'createdAt' : undefined,
                );
                res.set('X-Range', `${results.from}-${results.to}/${results.total}`);
                res.set('X-Current-Page', String(results.page));
                res.json(results).status(200);
            },
        ),
    );

    return router;
}
