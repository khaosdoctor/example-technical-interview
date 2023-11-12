import { setTimeout } from 'timers/promises';
import { AppConfig, appConfig } from './config.js';
import { UserRepository } from './data/UserRepository.js';
import { createConnection } from './data/mongodb.js';
import { RESTInterface } from './presentation/RESTInterface.js';
import { UserService } from './service/UserService.js';

export type ServiceList = Awaited<ReturnType<typeof Initialize>>;
export type ApplicationInterface = (
    config: AppConfig,
    services: ServiceList,
) => Promise<{ start: () => Promise<void>; stop: () => Promise<void> }>;

/**
 * It's also possible to use a dependency injection framework like InversifyJS
 * or TSyringe here to manage dependencies and create DI containers
 * but this would be overkill for this example
 */
async function Initialize(config: AppConfig) {
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
    const timeout = (fn: Function, ms: number = 3000) => {
        return Promise.race([fn(), setTimeout(ms).then(() => Promise.resolve(process.exit(1)))]);
    };

    const services = await Initialize(config);
    logger('Initialized services %O', services);
    const { start, stop } = await application(config, services);

    process.on('SIGINT', async () => {
        logger('SIGINT signal received.');
        await timeout(stop);
    });
    process.on('SIGTERM', async () => {
        logger('SIGTERM signal received.');
        await timeout(stop);
    });
    process.on('unhandledRejection', async (reason) => {
        logger('Unhandled rejection', reason);
    });
    process.on('uncaughtException', async (error) => {
        logger('Uncaught exception', error);
        await timeout(stop);
    });
    return start();
}

const config = appConfig();
await main(RESTInterface, config);
