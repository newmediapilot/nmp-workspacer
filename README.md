
# npm-workspacer

`npm-workspacer` is a Node.js script designed to help manage multiple GitHub repositories and automate setting up npm workspaces for your projects. It clones selected repositories into a `packages/` directory, modifies the `package.json` files within each repository, and adds npm workspace commands to the root `package.json` and the individual package `package.json` files.

## Features

- Clones repositories from GitHub into a `packages/` directory.
- Adds missing `package.json` files where necessary.
- Allows users to define custom workspace command prefixes.
- Adds workspace commands to the root `package.json` and to each package's `package.json`.
- Ensures that all repositories are added as npm workspaces for easier management.

## Installation

1. Clone or download the repository.

   ```bash
   git clone https://github.com/your-username/npm-workspacer.git
   cd npm-workspacer
   ```

2. Install the required dependencies.

   ```bash
   npm install
   ```

3. Ensure that Git is installed on your machine and that you have an active GitHub account.

## Initialization

1. Run the script to initialize the workspaces and set up your repositories.

   ```bash
   npm run start
   ```
## Commands

- `npm run start`: Initializes the workspace, clones selected repositories, sets up `package.json` files, and updates the root `package.json` with commands.

### The `npm run start` script does the following:

1. **Deletes and recreates the `packages/` directory**.
   - If the `packages/` directory already exists, it will be deleted and recreated. This ensures a clean environment for the cloned repositories.

2. **Prompts for GitHub Username**.
   - The script will ask for your GitHub username (with a default value if you're already logged into Git). It uses this username to fetch a list of repositories from GitHub.

3. **Fetches a List of Repositories from GitHub**.
   - The script will fetch a list of repositories associated with your GitHub account.

4. **Prompts for Repository Selection**.
   - You will be asked to select which repositories to clone. You can select multiple repositories or choose none.

5. **Clones the Selected Repositories**.
   - The repositories will be cloned into the `packages/` directory. If a repository already exists, it will be updated with `git fetch` and `git pull` to ensure the latest version.

6. **Asks for a Command Prefix**.
   - After cloning, you will be prompted to provide a prefix for the commands. This prefix will be used when defining workspace commands in the `package.json` files.

7. **Checks and Creates `package.json` Files if Missing**.
   - The script checks whether each cloned repository has a `package.json` file. If not, it prompts you to create one for the repository.

8. **Prompts for Workspace Commands**.
   - You will be asked to provide a list of commands (e.g., `build, test, deploy`) that you want to create for the root workspace. These commands are then added to the root `package.json` and the respective `package.json` files for each repository.

9. **Updates Root `package.json` and Package `package.json` Files**.
   - The root `package.json` file is updated with workspace-specific commands and a `workspaces` field. Each repository's `package.json` is also updated with the corresponding command definitions.

10. **Logs Success**.
    - Once the process is complete, the script logs success messages for each step, confirming that the repositories were cloned, the workspaces were set up, and the commands were added.
