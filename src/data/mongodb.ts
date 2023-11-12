import { MongoClient } from 'mongodb';
import { AppConfig } from '../config.js';

export async function createConnection(config: AppConfig) {
    const logger = config.logger.extend('data:mongodb');
    logger('Creating connection to MongoDB');
    const client = new MongoClient(config.MONGODB_URI);
    await client.connect();
    logger('Connection to MongoDB established');
    return client;
}
