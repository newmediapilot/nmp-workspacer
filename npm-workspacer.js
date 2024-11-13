const https = require('https');  // Make sure https is imported
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const { prompt } = require('enquirer');
const chalk = require('chalk'); // Use CommonJS require for chalk

// Helper function to log messages with time and step details
const log = (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
};

// Path to root package.json and packages directory
const rootPackageJsonPath = path.join(__dirname, 'package.json');
const packagesDir = path.join(__dirname, 'packages');

// Function to delete and recreate the packages directory
const deleteAndRecreatePackagesDir = () => {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(packagesDir)) {
            log(chalk.yellow(`🚮 Deleting existing packages directory: ${packagesDir}`));
            fs.rmSync(packagesDir, { recursive: true, force: true });  // Using fs.rm instead of rmdir
        }
        log(chalk.blue(`🏗️ Recreating packages directory: ${packagesDir}`));
        fs.mkdirSync(packagesDir);  // Recreate the directory
        resolve();
    });
};

// Function to get all subdirectories in packages/ folder
const getPackageFolders = () => {
    return new Promise((resolve, reject) => {
        const folders = fs.readdirSync(packagesDir).filter((file) => fs.statSync(path.join(packagesDir, file)).isDirectory());
        resolve(folders.map(folder => `packages/${folder}`));
    });
};

// Function to check and add workspaces to root package.json
const checkAndAddWorkspaces = () => {
    return new Promise((resolve, reject) => {
        try {
            // Read the current root package.json
            const packageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf-8'));

            // Check if the workspaces field exists
            if (!packageJson.workspaces) {
                log(chalk.yellow('🚛 workspaces not found in root package.json. Adding workspaces...'));

                // Get the list of package folders inside the packages/ directory
                getPackageFolders().then(packageFolders => {
                    // Add the workspaces field with the package folders
                    packageJson.workspaces = packageFolders;

                    // Write the updated package.json back to disk
                    fs.writeFileSync(rootPackageJsonPath, JSON.stringify(packageJson, null, 2));
                    log(chalk.green('🚛 workspaces added to root package.json.'));

                    // Restart the script after adding the workspaces field
                    log(chalk.blue('🚛 Restarting the script to apply changes...'));
                    execSync('node ' + __filename, { stdio: 'inherit' });
                    process.exit(); // Exit current process to allow restart
                }).catch(reject);
            } else {
                log(chalk.green('🚛 workspaces already found in root package.json. Proceeding with the script...'));
                resolve();
            }
        } catch (error) {
            log(chalk.red(`🚛 Error checking or adding workspaces: ${error.message}`));
            reject(error);
        }
    });
};

// Function to fetch repositories from GitHub
const fetchRepositories = (username) => {
    return new Promise((resolve, reject) => {
        const url = `https://api.github.com/users/${username}/repos`;
        const options = { headers: { 'User-Agent': 'nmp-workspacer' } };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        }).on('error', (err) => {
            reject(chalk.red(`🔍 fetchRepositories :: Error fetching repositories: ${err.message}`));
        });
    });
};

// Function to clone a repository
const cloneRepository = (url, targetDir) => {
    return new Promise((resolve, reject) => {
        log(chalk.blue(`🚲 cloneRepository :: Cloning ${url} into ${targetDir}...`));

        if (fs.existsSync(targetDir)) {
            log(chalk.yellow(`🚲 cloneRepository :: Directory ${targetDir} already exists, updating with git fetch and git pull.`));
            exec(`git -C ${targetDir} fetch && git -C ${targetDir} pull`, (error, stdout, stderr) => {
                if (error) {
                    reject(chalk.red(`🚲 cloneRepository :: Error updating ${url}: ${stderr}`));
                } else {
                    log(chalk.green(`🚲 cloneRepository :: Successfully updated ${url}`));
                    resolve();
                }
            });
        } else {
            exec(`git clone ${url} ${targetDir}`, (error, stdout, stderr) => {
                if (error) {
                    reject(chalk.red(`🚲 cloneRepository :: Error cloning ${url}: ${stderr}`));
                } else {
                    log(chalk.green(`🚲 cloneRepository :: Successfully cloned ${url}`));
                    resolve();
                }
            });
        }
    });
};

// Function to get the GitHub username from the user
const getGitHubUsername = async (defaultUsername) => {
    const response = await prompt({
        type: 'input',
        name: 'username',
        message: `Enter GitHub username to fetch repository list`,
        initial: defaultUsername
    });
    return response.username || defaultUsername;
};

// Function to handle the selection of repositories
const selectRepositories = async (repoUrls) => {
    const response = await prompt({
        type: 'multiselect',
        name: 'selectedUrls',
        message: 'Select repositories you want to use:',
        choices: repoUrls
    });
    return response.selectedUrls;
};

// Function to scan for missing package.json files in the packages
const scanForMissingPackageJson = () => {
    const packagesDir = path.join(__dirname, 'packages');
    log(chalk.blue(`🔍 scanForMissingPackageJson :: Scanning ${packagesDir} for missing package.json files...`));
    const folders = fs.readdirSync(packagesDir).filter((file) => fs.statSync(path.join(packagesDir, file)).isDirectory());

    const missingPackageJson = folders.filter((folder) => !fs.existsSync(path.join(packagesDir, folder, 'package.json')));

    return missingPackageJson;
};

// Function to create package.json file in a folder
const createPackageJson = (folder) => {
    const targetDir = path.join(__dirname, 'packages', folder);
    log(chalk.blue(`📦 createPackageJson :: Creating package.json in ${targetDir}...`));

    return new Promise((resolve, reject) => {
        exec(`npm init -y`, { cwd: targetDir }, async (error, stdout, stderr) => {
            if (error) {
                log(chalk.red(`📦 createPackageJson :: Error creating package.json in ${folder}: ${stderr}`));
                reject(error);
            } else {
                log(chalk.green(`📦 createPackageJson :: Successfully created package.json in ${folder}`));
                await delay(5000); // 5-second delay after the success message
                resolve();
            }
        });
    });
};

// Function to delay execution for a given number of milliseconds
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms)); // Delay for given milliseconds
};

// Function to add commands to package.json files
const addCommandsToPackageJson = (commandList, rootRepositoryName) => {
    const packagesDir = path.join(__dirname, 'packages');
    const folders = fs.readdirSync(packagesDir).filter((file) => fs.statSync(path.join(packagesDir, file)).isDirectory());

    folders.forEach(folder => {
        const packageJsonPath = path.join(packagesDir, folder, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = require(packageJsonPath);
            const repositoryName = path.basename(folder); // Get the repository name from the folder

            commandList.forEach(command => {
                const commandKey = `${rootRepositoryName}:${command}`; // Updated commandKey format
                if (!packageJson.scripts) {
                    packageJson.scripts = {};
                }

                // Modify the script command to use a relative path (./packages/*)
                packageJson.scripts[commandKey] = `echo ${repositoryName}:${rootRepositoryName}:${command} works`;  // Adjusted echo format
            });

            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            log(chalk.green(`🚚 addCommandsToPackageJson :: Added commands to ${folder}/package.json`));
        } else {
            log(chalk.red(`🚚 addCommandsToPackageJson :: package.json not found in ${folder}, skipping.`));
        }
    });
};

// Function to update the root package.json with new commands
const updateRootPackageJson = (commands, prefix) => {
    const rootPackageJsonPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(rootPackageJsonPath)) {
        const packageJson = require(rootPackageJsonPath);

        commands.forEach(command => {
            packageJson.scripts[command] = `npm run ${prefix}:${command} --workspace packages`;  // Updated workspace reference
        });

        // Adding workspaces to the root package.json
        packageJson.workspaces = getPackageFolders(); // Dynamically add workspaces based on available repositories

        fs.writeFileSync(rootPackageJsonPath, JSON.stringify(packageJson, null, 2));
        log(chalk.green(`🚛 updateRootPackageJson :: Updated package.json with commands and workspaces.`));
    } else {
        log(chalk.red('🚛 updateRootPackageJson :: root package.json not found.'));
    }
};

// Main function to run all tasks
const runTasks = async () => {
    let defaultUsername = '';
    try {
        defaultUsername = execSync('git config user.name').toString().trim();
    } catch (error) {
        log(chalk.red('🚲 getGitHubUsername :: Error: No Git username found in the current configuration.'));
    }

    await deleteAndRecreatePackagesDir();
    await checkAndAddWorkspaces();

    const githubUsername = await getGitHubUsername(defaultUsername);

    try {
        const repos = await fetchRepositories(githubUsername);
        if (repos && repos.length) {
            const repoUrls = repos.map(repo => repo.clone_url);

            const selectedUrls = await selectRepositories(repoUrls);
            if (selectedUrls.length === 0) {
                log(chalk.red('🚲 selectRepositories :: No repositories selected, closing workspacer.'));
                return;
            }

            const packagesDir = path.join(__dirname, 'packages');
            if (!fs.existsSync(packagesDir)) {
                fs.mkdirSync(packagesDir);
            }

            for (const url of selectedUrls) {
                const repoName = path.basename(url, '.git');
                const targetDir = path.join(packagesDir, repoName);
                await cloneRepository(url, targetDir);
            }

            log();  // Line break after cloning

            const currentRepoName = path.basename(__dirname);
            const prefix = await promptForPrefix(currentRepoName);
            log(chalk.green(`🚛 promptForPrefix :: Selected prefix for commands: ${prefix}`));

            const missingPackageJson = scanForMissingPackageJson();

            if (missingPackageJson.length > 0) {
                const response = await prompt({
                    type: 'confirm',
                    name: 'createPackageJson',
                    message: 'Some repositories are missing package.json files. Would you like to create them?',
                });

                if (response.createPackageJson) {
                    const { selectedFolders } = await prompt({
                        type: 'multiselect',
                        name: 'selectedFolders',
                        message: 'Select the repositories to create package.json files for:',
                        choices: missingPackageJson
                    });

                    selectedFolders.forEach((folder) => createPackageJson(folder));
                }
            } else {
                log(chalk.green('🚛 createPackageJson :: All repositories already have a package.json file.'));
            }

            // Prompt for the commands
            const commands = await promptForCommands();

            // Update the root package.json with the commands
            updateRootPackageJson(commands, prefix);

            // Add commands to each package's package.json
            addCommandsToPackageJson(commands, currentRepoName);

            // Log done for package.json modification
            log(chalk.green('🚛 Done modifying package.json files in root and packages.'));
        } else {
            log(chalk.red('🚲 fetchRepositories :: No repositories found for user.'));
        }
    } catch (error) {
        log(chalk.red(`🚲 main :: Error fetching repositories: ${error.message}`));
    }
};

// Start the process
runTasks().then(() => {
    log(chalk.green('🚛 All tasks completed successfully!'));
}).catch((err) => {
    log(chalk.red('🚛 Error: Process failed.'));
});
