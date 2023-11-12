/**
 * This could be created as an abstract class and extended by specific error classes
 * like UserNotFoundError, ConflictingUserError, etc.
 * but since the app is small, I chose to use one error that will be used for all
 */
export class HTTPError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly code: string,
        public readonly name: string,
    ) {
        super(message);
    }
}
