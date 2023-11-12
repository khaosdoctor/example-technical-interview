import assert from 'node:assert';
import { describe, it } from 'node:test';
import { appConfig } from './config.js';

describe('config.ts', () => {
    it('should generate a valid config with default values', () => {
        const { logger, ...config } = appConfig({});
        assert.deepStrictEqual(
            {
                PORT: 3000,
                MONGODB_URI: 'mongodb://localhost:27017/perspective',
                MONGODB_DBNAME: 'perspective',
            },
            config,
        );
        assert.ok('enabled' in logger);
    });

    it('should generate a valid config with passed values', () => {
        const { logger, ...config } = appConfig({
            PORT: '4040',
        });
        assert.deepStrictEqual(
            {
                PORT: 4040,
                MONGODB_URI: 'mongodb://localhost:27017/perspective',
                MONGODB_DBNAME: 'perspective',
            },
            config,
        );
        assert.ok('enabled' in logger);
    });
});
