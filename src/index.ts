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

async function main(application: ApplicationInterface, config: AppConfig = appConfig) {
    const services = await Initialize(config);
    const { start, stop } = await application(config, services);

    process.on('SIGINT', () => {
        console.info('SIGINT signal received.');
        stop();
    });
    process.on('SIGTERM', () => {
        console.info('SIGTERM signal received.');
        stop();
    });
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection', reason);
    });
    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception', error);
        stop();
    });
    return start();
}

await main(RESTInterface);
