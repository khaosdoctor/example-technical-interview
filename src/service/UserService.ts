import { randomUUID } from 'crypto';
import { User, UserCreationType, UserRepository, UserUpdateType } from '../data/UserRepository.js';
import { HTTPError } from '../presentation/errors/HTTPError.js';

export class UserService {
    constructor(private readonly repository: UserRepository) {}

    async createUser(user: UserCreationType) {
        const completeUser: User = {
            ...user,
            id: randomUUID(),
            createdAt: new Date(),
        };

        return this.repository.create(completeUser);
    }

    async findById(id: User['id']) {
        const user = await this.repository.findById(id);
        if (!user) {
            throw new HTTPError('User not found', 404, 'USER_NOT_FOUND', 'UserNotFoundError');
        }
        return user;
    }

    async updateUser(id: User['id'], updatedFields: UserUpdateType) {
        const existingUser = await this.findById(id);
        const newUser: User = {
            ...existingUser,
            ...updatedFields,
        };
        return this.repository.update(newUser);
    }

    async deleteUser(id: User['id']) {
        return this.repository.delete(id);
    }

    async listUsers(page: number = 1, limit: number = 10, sort?: keyof Omit<User, 'id'>) {
        return this.repository.list(page, limit, sort);
    }
}
