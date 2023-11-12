import assert from 'node:assert';
import { afterEach, describe, it, mock } from 'node:test';
import { UserRepository } from '../data/UserRepository.js';
import { UserService } from './UserService.js';
import { HTTPError } from '../presentation/errors/HTTPError.js';

describe('UserService', () => {
    const mockRepository = {
        create: mock.fn((user: any) => user),
        findById: mock.fn(),
        update: mock.fn(),
        delete: mock.fn(),
        list: mock.fn(),
    };

    const service = new UserService(mockRepository as unknown as UserRepository);

    it('should create a user with ID and date', async () => {
        const user = {
            name: 'John Doe',
            email: 'some@email.com',
        };

        const result = await service.createUser(user);
        assert.ok(result.id);
        assert.ok(result.createdAt instanceof Date);
        assert.strictEqual(mockRepository.create.mock.callCount(), 1);
        const argumentUser = mockRepository.create.mock.calls[0].arguments[0];
        assert.strictEqual(typeof argumentUser, 'object');
        assert.strictEqual(argumentUser.name, user.name);
        assert.strictEqual(argumentUser.email, user.email);
        // loose uuid validation
        assert.ok(/^[a-f0-9-]{36}$/.test(argumentUser.id));
        assert.ok(argumentUser.createdAt instanceof Date);
    });

    it('should find a user by id', async () => {
        mockRepository.findById.mock.mockImplementationOnce(async (id: string) => ({
            id,
            createdAt: new Date(),
            name: 'John Doe',
            email: 'some@email.com',
        }));

        const result = await service.findById('some-id');
        assert.strictEqual(mockRepository.findById.mock.callCount(), 1);
        assert.strictEqual(mockRepository.findById.mock.calls[0].arguments[0], 'some-id');
        assert.strictEqual(typeof result, 'object');
        mockRepository.findById.mock.resetCalls();
    });

    it('should throw an error if user is not found', async () => {
        mockRepository.findById.mock.mockImplementationOnce(async () => null);

        await assert.rejects(service.findById('some-id'), (err: HTTPError) => {
            assert.strictEqual(err.name, 'UserNotFoundError');
            assert.ok(err instanceof HTTPError);
            return true;
        });
        assert.strictEqual(mockRepository.findById.mock.callCount(), 1);
        assert.strictEqual(mockRepository.findById.mock.calls[0].arguments[0], 'some-id');
        mockRepository.findById.mock.resetCalls();
    });

    it('should update a user', async () => {
        mockRepository.findById.mock.mockImplementationOnce(async (id: string) => ({
            id,
            createdAt: new Date(),
            name: 'John Doe',
            email: 'some@email.com',
        }));

        mockRepository.update.mock.mockImplementationOnce(async (user: any) => user);

        const result = await service.updateUser('test-id', { name: 'Jane Doe' });
        assert.strictEqual(mockRepository.findById.mock.callCount(), 1);
        assert.strictEqual(mockRepository.findById.mock.calls[0].arguments[0], 'test-id');
        assert.strictEqual(mockRepository.update.mock.callCount(), 1);
        assert.strictEqual(typeof result, 'object');
        assert.strictEqual(result.name, 'Jane Doe');
        mockRepository.findById.mock.resetCalls();
        mockRepository.update.mock.resetCalls();
    });

    it('should delete a user', async () => {
        mockRepository.delete.mock.mockImplementationOnce(async (id: string) => true);
        const result = await service.deleteUser('test-id');
        assert.strictEqual(mockRepository.delete.mock.callCount(), 1);
        assert.strictEqual(mockRepository.delete.mock.calls[0].arguments[0], 'test-id');
        assert.strictEqual(result, true);
        mockRepository.delete.mock.resetCalls();
    });

    it('should list users', async () => {
        mockRepository.list.mock.mockImplementationOnce(
            async (page: number, limit: number, sort?: string) => {
                return {
                    page,
                    from: (page - 1) * limit,
                    to: page * limit,
                    total: 1,
                    results: [
                        {
                            id: 'test-id',
                            createdAt: new Date(),
                            name: 'John Doe',
                            email: 'some@email.com',
                        },
                    ],
                };
            },
        );

        const result = await service.listUsers();
        assert.strictEqual(mockRepository.list.mock.callCount(), 1);
        assert.strictEqual(mockRepository.list.mock.calls[0].arguments[0], 1);
        assert.strictEqual(mockRepository.list.mock.calls[0].arguments[1], 10);
        assert.strictEqual(typeof result, 'object');
        assert.strictEqual(result.page, 1);
    });
});
