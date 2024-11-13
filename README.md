
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

- **Deletes and recreates the `packages/` directory**:
   - If the `packages/` directory already exists, it will be deleted and recreated. This ensures a clean environment for the cloned repositories.

- **Prompts for GitHub Username**:
   - The script will ask for your GitHub username (with a default value if you're already logged into Git). It uses this username to fetch a list of repositories from GitHub.

- **Fetches a List of Repositories from GitHub**:
   - The script will fetch a list of repositories associated with your GitHub account.

- **Prompts for Repository Selection**:
   - You will be asked to select which repositories to clone. You can select multiple repositories.

- **Clones the Selected Repositories**:
   - The repositories will be cloned into the `packages/` directory. If a repository already exists, it will be updated with `git fetch` and `git pull` to ensure the latest version.

- **Asks for a Command Prefix**:
   - After cloning, you will be prompted to provide a prefix for the commands. This prefix will be used when defining workspace commands in the `package.json` files.

- **Checks and Creates `package.json` Files if Missing**:
   - The script checks whether each cloned repository has a `package.json` file. If not, it prompts you to create one for the repository.

- **Prompts for Workspace Commands**:
   - You will be asked to provide a list of commands (e.g., `build, test, deploy`) that you want to create for the root workspace. These commands are then added to the root `package.json` and the respective `package.json` files for each repository.

- **Updates Root `package.json` and Package `package.json` Files**:
   - The root `package.json` file is updated with workspace-specific commands and a `workspaces` field. Each repository's `package.json` is also updated with the corresponding command definitions.

- **Logs Success**:
    - Once the process is complete, the script logs success messages for each step, confirming that the repositories were cloned, the workspaces were set up, and the commands were added.

## Command Naming Example

Let's say your root repository is called `root-repo` and you selected the following commands: `build`, `test`, and `deploy`. After running the script, your setup would look like this:

### In the **root `package.json`**:
```json
{
  "scripts": {
    "build": "npm run root-repo:build --workspace packages",
    "test": "npm run root-repo:test --workspace packages",
    "deploy": "npm run root-repo:deploy --workspace packages"
  }
}
```

### In each **package's `package.json`**:
```json
{
  "scripts": {
    "root-repo:build": "echo package-name:root-repo:build works",
    "root-repo:test": "echo package-name:root-repo:test works",
    "root-repo:deploy": "echo package-name:root-repo:deploy works"
  }
}
```

### Explanation:
- In the **root `package.json`**, the commands are prefixed with `root-repo` (the name of your root repository), followed by the command name, e.g., `root-repo:build`.
- In the **individual repository `package.json`**, the script echoes a message indicating that the specific command has been executed in that repository.
