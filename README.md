
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

## Commands

- `npm run start`: Initializes the workspace, clones selected repositories, sets up `package.json` files, and updates the root `package.json` with commands.

## How the Script Works (Step-by-Step)

1. **Initialization and Cleanup**:
   - The script first deletes the existing `packages/` directory and recreates it. This ensures a fresh start before cloning any repositories.

2. **GitHub Username and Repository Selection**:
   - The script prompts the user for a GitHub username and fetches the list of repositories associated with that username.
   - You will be prompted to select the repositories you wish to clone. If no repositories are selected, the script exits.

3. **Cloning Repositories**:
   - The selected repositories are cloned into the `packages/` directory. If a repository already exists in the directory, the script updates it using `git fetch` and `git pull`.

4. **Creating `package.json` Files**:
   - The script checks whether each cloned repository has a `package.json`. If any are missing, the user is asked if they want to create them. If confirmed, `npm init -y` is run to generate the file.

5. **Command Prefix and Workspace Setup**:
   - The user is prompted to provide a prefix for commands (e.g., `root-repo:`), which will be used in both the root `package.json` and the individual package files.
   - The script then prompts for a list of commands that should be added to the `package.json` files. It will add these commands in the form of `npm run root-repo:command --workspace packages`.

6. **Updating `package.json`**:
   - The root `package.json` is updated to include a `workspaces` field that points to the `packages/*` directory.
   - The selected commands are added to the root `package.json` as well as each individual repository's `package.json`, with an `echo` statement that outputs success when the commands are run.

7. **Completion**:
   - After updating all `package.json` files, the script logs a success message indicating that everything is set up correctly.

## Troubleshooting

- **Error: `fs.rmdir` deprecated**: Ensure you're using Node.js version 14.14.0 or above. The script uses `fs.rmSync` instead of `fs.rmdir`, which is supported in newer Node versions.
  
- **Error: No Git username found**: Ensure that your Git configuration includes a valid username. You can set this using the following command:

  ```bash
  git config --global user.name "Your Name"
  ```

- **Command not recognized in `package.json`**: Make sure you have correctly followed the prompts and selected the commands to create in the workspace. You can verify the commands in both the root and repository `package.json` files.

## Contributing

Feel free to open issues and pull requests for improvements or bug fixes. Contributions are welcome!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
