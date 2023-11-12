import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import type { Server } from 'http';
import { ZodError } from 'zod';
import { AppConfig } from '../config.js';
import { HTTPError } from './errors/HTTPError.js';
import { userRouter } from './routes.js';
import { ServiceList } from '../index.js';

function setSystemRoutes(app: Express) {
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.options('*', cors());
    app.get('/ping', (_, res) => res.send('pong').status(200));
    return app;
}

function errorMiddleware(err: HTTPError | ZodError, _: Request, res: Response, next: NextFunction) {
    if (err) {
        if (err instanceof ZodError) {
            return res.status(422).json({
                code: 'INVALID_INPUT',
                message: err.message,
                name: err.name,
                errors: err.issues,
            });
        }

        return res.status(err?.status ?? 500).json({
            code: err?.code ?? 'UNKNOWN_ERROR',
            message: err.message,
            name: err.name,
        });
    }
    next();
}

export async function RESTInterface(config: AppConfig, services: ServiceList) {
    const logger = config.logger.extend('perspective:presentation:rest-interface');
    const app: Express = express();
    let server: Server | undefined;
    setSystemRoutes(app);

    // Route definitions
    app.use('/users', userRouter(services.userService, config));

    // Final error handler
    app.use(errorMiddleware);

    /**
     * These functions are used by the main application to start and stop the REST interface
     * they could be defined diretly in the return clause but this is cleaner
     */
    const start = async () => {
        logger('Starting REST Interface');
        server = app.listen(config.PORT, () => console.log(`Listening on port ${config.PORT}`));
    };

    const stop = async () => {
        logger('Stopping REST Interface');
        if (server) {
            server.close((err) => {
                let exitCode = 0;
                if (err) {
                    logger('Error stopping REST Interface: %O', err);
                    exitCode = 1;
                }
                logger('REST Interface stopped');
                process.exit(exitCode);
            });
            return;
        }
        process.exit(0);
    };

    return {
        start,
        stop,
    };
}
