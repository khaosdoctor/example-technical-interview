import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { RESTInterface } from './RESTInterface.js';
import { AppConfig } from '../config';
import { ServiceList } from '../index.js';
import request from 'supertest';
import { inspect } from 'node:util';
import { randomUUID } from 'node:crypto';
import { HTTPError } from './errors/HTTPError.js';

describe('RESTInterface', async () => {
    const userServiceMock = {
        createUser: mock.fn(),
        findById: mock.fn(),
        updateUser: mock.fn(),
        deleteUser: mock.fn(),
        listUsers: mock.fn(),
    };

    const serviceListMock = {
        userService: userServiceMock,
    };

    const mockConfig = {
        logger: {
            extend: mock.fn((namespace: string) => (message: string) => ({ namespace, message })),
        },
    };

    const { app } = await RESTInterface(
        mockConfig as unknown as AppConfig,
        serviceListMock as unknown as ServiceList,
    );

    const wrappedApp = request(app);

    describe('GET /ping', () => {
        it('should return pong', () => {
            wrappedApp
                .get('/ping')
                .expect(200, 'pong')
                .end(() => true);
        });
    });

    describe('POST /users', () => {
        it('should return 201 and the created user', async () => {
            const user = {
                name: 'John Doe',
                email: 'some@email.com',
            };

            const returnedUser = {
                ...user,
                id: 'some-id',
                createdAt: new Date().toISOString(),
            };

            userServiceMock.createUser.mock.mockImplementationOnce(async () => returnedUser);
            await wrappedApp.post('/users/').send(user).expect(201, returnedUser);

            assert.strictEqual(userServiceMock.createUser.mock.callCount(), 1);
            userServiceMock.createUser.mock.resetCalls();
            userServiceMock.createUser.mock.restore();
        });

        it('should return 422 when there is a validation error', async () => {
            const user = {
                email: 'some@email.com',
            };

            userServiceMock.createUser.mock.mockImplementationOnce(async (user: any) => ({
                ...user,
                id: 'some-id',
                createdAt: new Date(),
            }));

            const response = await wrappedApp.post('/users').send(user).expect(422);

            assert.deepStrictEqual(response.body.code, 'INVALID_INPUT');
            assert.deepStrictEqual(response.body.name, 'ZodError');
            assert.deepStrictEqual(response.body.errors.length, 1);
            assert.deepStrictEqual(response.body.errors[0].path, ['name']);
            assert.strictEqual(userServiceMock.createUser.mock.callCount(), 0);
            userServiceMock.createUser.mock.resetCalls();
            userServiceMock.createUser.mock.restore();
        });
    });

    describe('GET /users/:id', () => {
        it('should return 200 and the user', async () => {
            const user = {
                id: 'some-id',
                name: 'John Doe',
                createdAt: new Date().toISOString(),
                email: 'some@email.com',
            };

            userServiceMock.findById.mock.mockImplementationOnce(async (id: any) => ({
                ...user,
                id,
            }));

            const response = await wrappedApp.get(`/users/${user.id}`).expect(200);
            assert.deepStrictEqual(inspect(response.body), inspect(user));
            userServiceMock.findById.mock.resetCalls();
            userServiceMock.findById.mock.restore();
        });

        it('should return 404 if the user is not found', async () => {
            const err = new HTTPError('User not found', 404, 'USER_NOT_FOUND', 'UserNotFoundError');
            userServiceMock.findById.mock.mockImplementationOnce(async () => {
                throw err;
            });

            const response = await wrappedApp.get(`/users/some-id`).expect(404);
            assert.deepStrictEqual(
                inspect(response.body),
                inspect({
                    code: err.code,
                    message: err.message,
                    name: err.name,
                }),
            );
            assert.strictEqual(userServiceMock.findById.mock.callCount(), 1);
            userServiceMock.findById.mock.resetCalls();
            userServiceMock.findById.mock.restore();
        });
    });

    describe('DELETE /user/:id', () => {
        it('should return 204', async () => {
            userServiceMock.deleteUser.mock.mockImplementationOnce(async () => {
                return true;
            });

            await wrappedApp.delete(`/users/some-id`).expect(204);
            assert.strictEqual(userServiceMock.deleteUser.mock.callCount(), 1);
            userServiceMock.deleteUser.mock.resetCalls();
            userServiceMock.deleteUser.mock.restore();
        });
    });

    describe('PATCH /user/:id', () => {
        it('should return 200 and the updated user', async () => {
            const user = {
                id: 'some-id',
                name: 'John Doe',
                createdAt: new Date().toISOString(),
                email: 'some@email.com',
            };

            const updatedUser = {
                name: 'Jane Doe',
            };

            userServiceMock.findById.mock.mockImplementationOnce(async (id: any) => ({
                ...user,
                id,
            }));

            userServiceMock.updateUser.mock.mockImplementationOnce(
                async (_: any, updateFields: any) => ({
                    ...user,
                    ...updateFields,
                }),
            );

            const response = await wrappedApp
                .patch(`/users/${user.id}`)
                .send(updatedUser)
                .expect(200);

            assert.deepStrictEqual(inspect(response.body), inspect({ ...user, ...updatedUser }));
            userServiceMock.findById.mock.resetCalls();
            userServiceMock.findById.mock.restore();
            userServiceMock.updateUser.mock.resetCalls();
            userServiceMock.updateUser.mock.restore();
        });
        it('should return 422 on wrong data', async () => {
            const updatedUser = {
                name: 123,
            };

            const response = await wrappedApp.patch(`/users/some-id`).send(updatedUser).expect(422);

            assert.deepStrictEqual(response.body.code, 'INVALID_INPUT');
            assert.deepStrictEqual(response.body.name, 'ZodError');
            assert.strictEqual(userServiceMock.findById.mock.callCount(), 0);
            assert.strictEqual(userServiceMock.updateUser.mock.callCount(), 0);
            userServiceMock.findById.mock.resetCalls();
            userServiceMock.updateUser.mock.resetCalls();
        });
    });

    describe('GET /users', () => {
        it('should return 200 and the list of users', async () => {
            const users = [
                {
                    id: randomUUID(),
                    name: 'John Doe',
                    createdAt: new Date().toISOString(),
                    email: 'some@email',
                },
            ];

            const listReturn = {
                from: 1,
                to: 1,
                total: 1,
                page: 1,
                results: users,
            };

            userServiceMock.listUsers.mock.mockImplementationOnce(async () => listReturn);

            const response = await wrappedApp.get(`/users`).expect(200);

            assert.deepStrictEqual(inspect(response.body), inspect(listReturn));
        });
    });
});
