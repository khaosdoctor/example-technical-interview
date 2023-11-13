# Backend Engineer Work Sample

This project skeleton contains a basic Express setup one endpoint to create a user and one endpoint to fetch all users, as well as a basic empty unit test.

## Scripts

-   `npm run start` - Starts the server in "prod mode"
-   `npm run start:dev` - Starts the server in "dev mode"
-   `npm run build` - Builds the project
-   `npm run test` - Runs the tests with coverage by default

## Setup

The project only requires you to have Docker installed on the machine. There's a `docker-compose.yml` file that will start a MongoDB database. You don't need to run the scripts manually, the `docker-compose.yml` file will be used by the `npm run start:dev` script before running the server.

The node version **must be over 20.6** so you can use the `env-file` module to load the `.env` file.

## Goal

1. Adjust POST /users that it accepts a user and stores it in a database.
    - The user should have a unique id, a name, a unique email address and a creation date
2. Adjust GET /users that it returns (all) users from the database.
    - This endpoint should be able to receive a query parameter `created` which sorts users by creation date ascending or descending.

Feel free to add or change this project as you like.

## Changelog

### Remarks

The project is intentionally a bit more complex than what I use to do in APIs like this to highlight some of the things that I like to work with, like the native runner and using less dependencies, with focus on long-term maintenance so it's a bit easier to add new interfaces like CLIs or anything else, as well as moving the database around without changing the main logic.

### Configuration changes

-   Updated from Node 18 to Node 20 to be able to use `env-file` and remove `dotenv` dependency (I use `asdf` so I manually updated `nvmrc` to `v20` and added `.tool-versions` file)
-   Removed `ts-node` in favor of newer and faster `tsx`
-   Add `strict: true` to `tsconfig.json`
-   Forces TS to generate ESM instead of commonjs modules
-   Added build script
-   Added `start:dev` script to run locally and separated from the "production version"
-   Removed includes from `tsconfig.json` since it's not needed anymore because I moved the test files to be together with the file they're testing, this way we can check the tests right along the files we are editing and it's faster to find it without the need to replicate the folder structure
-   Removed the ability of TS to check or allow JS files, TS-only projescts are safer and easier to maintain
-   Updated all modules to latest versions
-   Update gitignore to ignore some common node folders
-   Removed Jest in favor of the default node test runner and added glob to be able to run all tests in the `src` folder (Node 21 adds support for glob patterns in test files) this greatly reduces the complexity of the project and makes it easier to maintain
-   To add coverage, I added `c8` which is the default V8 code coverage tool and added a script to run it in the `test` script, this file will not need to be changed in the future and it's easier to maintain
    - Still in coverage, it's possible to use `--experimental-test-coverage` to achieve the same results, but it's highly experimental yet

### Code changes

- Use `zod` to validate the body of the request
- Remove `dotenv` as we are using `env-file` now
- Changes are also in comments in the code
- Added complete CRUD for users
