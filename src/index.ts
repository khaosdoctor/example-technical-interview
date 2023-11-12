import { setTimeout } from 'timers/promises';
import { AppConfig, appConfig } from './config.js';
import { UserRepository } from './data/UserRepository.js';
import { createConnection } from './data/mongodb.js';
import { RESTInterface } from './presentation/RESTInterface.js';
import { UserService } from './service/UserService.js';

export type ServiceList = Awaited<ReturnType<typeof initializeDependencies>>;
export type ApplicationInterface = (
    config: AppConfig,
    services: ServiceList,
) => Promise<{ start: () => Promise<void>; stop: () => Promise<void> }>;

/**
 * It's also possible to use a dependency injection framework like InversifyJS
 * or TSyringe here to manage dependencies and create DI containers
 * but this would be overkill for this example
 */
async function initializeDependencies(config: AppConfig) {
    const connection = await createConnection(config);
    const userRepository = new UserRepository(connection, config);
    const userService = new UserService(userRepository);
    return {
        userService,
    };
}

async function main(application: ApplicationInterface, config: AppConfig) {
    const logger = config.logger.extend('perspective:main');
    logger('Starting application with config %O', config);

    const services = await initializeDependencies(config);
    const { start, stop } = await application(config, services);

    // Graceful shutdown
    process.on('SIGINT', async () => {
        logger('SIGINT signal received.');
        await stop();
    });
    process.on('SIGTERM', async () => {
        logger('SIGTERM signal received.');
        await stop();
    });
    process.on('unhandledRejection', async (reason) => {
        logger('Unhandled rejection', reason);
    });
    process.on('uncaughtException', async (error) => {
        logger('Uncaught exception', error);
        await stop();
    });

    return start();
}

const config = appConfig();
await main(RESTInterface, config);
