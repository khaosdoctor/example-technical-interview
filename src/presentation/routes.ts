import { Request, Router } from 'express';
import { z } from 'zod';
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

export function userRouter(service: UserService) {
    const router = Router();

    router.post('/', async (req, res) => {
        const user = UserCreationSchema.parse(req.body);
        const result = await service.createUser(user);
        res.json(result).status(201);
    });

    router.get('/:id', async (req, res) => {
        // pick a valid UUID from the user schema and parse it
        const { id } = UserSchema.pick({ id: true }).parse({ id: req.params });
        const result = await service.findById(id);
        res.json(result).status(200);
    });

    router.delete('/:id', async (req, res) => {
        // pick a valid UUID from the user schema and parse it
        const { id } = UserSchema.pick({ id: true }).parse({ id: req.params });
        await service.deleteUser(id);
        res.status(204);
    });

    router.patch('/:id', async (req, res) => {
        // pick a valid UUID from the user schema and parse it
        const { id } = UserSchema.pick({ id: true }).parse({ id: req.params });
        const user = UserUpdateSchema.parse(req.body);
        const result = await service.updateUser(id, user);
        res.json(result).status(200);
    });

    router.get(
        '/',
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
    );

    return router;
}
