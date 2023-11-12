import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { AppConfig } from '../config.js';
import { UserRepository } from './UserRepository.js';
import { inspect } from 'node:util';

describe('UserService', () => {
    const collectionMock = {
        insertOne: mock.fn(),
        updateOne: mock.fn(),
        deleteOne: mock.fn(),
        findOne: mock.fn(),
        find: mock.fn(),
        countDocuments: mock.fn(() => 10),
    };

    const mockConnection = {
        db: () => ({
            collection: () => collectionMock,
        }),
    };

    const mockConfig = {
        logger: {
            extend: mock.fn((namespace: string) => (message: string) => ({ namespace, message })),
        },
    };

    const repository = new UserRepository(
        mockConnection as any,
        mockConfig as unknown as AppConfig,
    );

    it('should create a user with ID and date', async () => {
        const user = {
            name: 'John Doe',
            email: 'some@email.com',
            id: 'some-id',
            createdAt: new Date(),
        };

        const result = await repository.create(user);
        assert.ok(result.id);
        assert.ok(result.createdAt instanceof Date);
        assert.strictEqual(collectionMock.insertOne.mock.callCount(), 1);
        assert.strictEqual(collectionMock.insertOne.mock.calls[0].arguments[0], user);
    });

    it('should find a user by id', async () => {
        collectionMock.findOne.mock.mockImplementationOnce(async (id: string) => ({
            id,
            createdAt: new Date(),
            name: 'John Doe',
            email: 'some@email.com',
        }));

        const result = await repository.findById('some-id');
        assert.strictEqual(collectionMock.findOne.mock.callCount(), 1);
        assert.strictEqual(
            inspect(collectionMock.findOne.mock.calls[0].arguments[0]),
            inspect({ id: 'some-id' }),
        );
        assert.strictEqual(typeof result, 'object');
        collectionMock.findOne.mock.resetCalls();
    });

    it('should not throw an error if user is not found', async () => {
        collectionMock.findOne.mock.mockImplementationOnce(async () => null);
        const result = await repository.findById('some-id');
        assert.strictEqual(result, null);
        assert.strictEqual(collectionMock.findOne.mock.callCount(), 1);
        assert.strictEqual(
            inspect(collectionMock.findOne.mock.calls[0].arguments[0]),
            inspect({ id: 'some-id' }),
        );
        collectionMock.findOne.mock.resetCalls();
    });

    it('should update a user', async () => {
        const existingUser = {
            id: 'some-id',
            createdAt: new Date(),
            name: 'John Doe',
            email: 'some@email.com',
        };
        collectionMock.findOne.mock.mockImplementationOnce(async () => existingUser);
        collectionMock.updateOne.mock.mockImplementationOnce(async (user: any) => user);

        const result = await repository.update({ ...existingUser, name: 'Jane Doe' });

        assert.strictEqual(
            inspect(collectionMock.updateOne.mock.calls[0].arguments[0]),
            inspect({ id: existingUser.id }),
        );
        assert.strictEqual(collectionMock.updateOne.mock.callCount(), 1);
        assert.strictEqual(typeof result, 'object');
        assert.strictEqual(result.name, 'Jane Doe');
        collectionMock.findOne.mock.resetCalls();
        collectionMock.updateOne.mock.resetCalls();
    });

    it('should delete a user', async () => {
        collectionMock.deleteOne.mock.mockImplementationOnce(async (id: string) => ({
            deletedCount: 1,
        }));
        const result = await repository.delete('test-id');
        assert.strictEqual(collectionMock.deleteOne.mock.callCount(), 1);
        assert.strictEqual(
            inspect(collectionMock.deleteOne.mock.calls[0].arguments[0]),
            inspect({ id: 'test-id' }),
        );
        assert.strictEqual(result, true);
        collectionMock.deleteOne.mock.resetCalls();
    });

    it('should list users', async () => {
        collectionMock.find.mock.mockImplementationOnce((query: any, options: any) => ({
            skip: (page: number) => ({
                limit: (limit: number) => ({
                    toArray: async () => [
                        {
                            id: 'some-id',
                            createdAt: new Date(),
                            name: 'John Doe',
                            email: 'some@email.com',
                        },
                    ],
                }),
            }),
        }));

        const result = await repository.list(1, 10);
        assert.strictEqual(collectionMock.find.mock.callCount(), 1);
        assert.strictEqual(inspect(collectionMock.find.mock.calls[0].arguments[0]), inspect({}));
        assert.strictEqual(
            inspect(collectionMock.find.mock.calls[0].arguments[1]),
            inspect({ projection: { _id: 0 } }),
        );
        assert.strictEqual(typeof result, 'object');
        assert.strictEqual(result.page, 1);
        collectionMock.find.mock.resetCalls();
    });

    it('should list users based on sort parameters', async () => {
        collectionMock.find.mock.mockImplementationOnce((query: any, options: any) => ({
            skip: (page: number) => ({
                limit: (limit: number) => ({
                    toArray: async () => [
                        {
                            id: 'some-id',
                            createdAt: new Date(),
                            name: 'John Doe',
                            email: 'some@email.com',
                        },
                    ],
                }),
            }),
        }));

        const result = await repository.list(1, 10, 'name');
        assert.strictEqual(collectionMock.find.mock.callCount(), 1);
        assert.strictEqual(inspect(collectionMock.find.mock.calls[0].arguments[0]), inspect({}));
        assert.strictEqual(
            inspect(collectionMock.find.mock.calls[0].arguments[1]),
            inspect({ sort: { name: 1 }, projection: { _id: 0 } }),
        );
        assert.strictEqual(typeof result, 'object');
        assert.strictEqual(result.page, 1);
    });
});
