import { MongoClient, ObjectId, type Sort } from 'mongodb';
import { AppConfig, appConfig } from '../config.js';
import { z } from 'zod';

/**
 * I usually create a `domain` directory inside the src folder to add domain objects
 * this one would've been a User class, but it's a simple example so I'm using a type
 * and a schema instead
 */
export const UserCreationSchema = z.object({
    name: z.string(),
    email: z.string().email(),
});
export const UserUpdateSchema = UserCreationSchema.partial();
export const UserSchema = UserCreationSchema.extend({
    id: z.string().uuid(),
    createdAt: z.date(),
});
export type UserUpdateType = z.infer<typeof UserUpdateSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserCreationType = z.infer<typeof UserCreationSchema>;

export class UserRepository {
    static collectionName = 'users';
    static databaseName = 'perspective';

    #logger;
    #collection;
    constructor(connection: MongoClient, config: AppConfig = appConfig) {
        this.#logger = config.logger.extend('data:UserRepository');
        const db = connection.db(UserRepository.databaseName);
        const collection = db.collection(UserRepository.collectionName);
        this.#collection = collection;
    }

    async create(user: User) {
        this.#logger('Creating user %o', user);
        await this.#collection.insertOne({ ...user, _id: new ObjectId(user.id) });
        return user;
    }

    async update(user: User) {
        this.#logger('Updating user %s with %o', user.id, user);
        const { id, ...update } = user;
        await this.#collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
        return user;
    }

    async delete(id: User['id']) {
        this.#logger('Deleting user %s', id);
        const result = await this.#collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount === 1;
    }

    async findBy(property: keyof Omit<User, 'id'>, value: User[keyof Omit<User, 'id'>]) {
        this.#logger('Finding user by %s with value %s', property, value);
        const user = await this.#collection.findOne<User>({ [property]: value });
        return user;
    }

    async findById(id: User['id']) {
        this.#logger('Finding user by id %s', id);
        const user = await this.#collection.findOne<User>({ _id: new ObjectId(id) });
        return user;
    }

    async list(page: number, limit: number, sort?: keyof Omit<User, 'id'>) {
        this.#logger('Listing users');
        const options = sort ? { sort: { [sort]: 1 } satisfies Sort } : {};
        const users = await this.#collection
            .find<User>({}, options)
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();
        this.#logger('Found %d users', users.length);
        return {
            page,
            from: (page - 1) * limit,
            to: page * limit,
            total: await this.#collection.countDocuments(),
            results: users,
        };
    }
}
