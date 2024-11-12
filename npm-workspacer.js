const https = require('https');
const { execSync, exec } = require('child_process');
const { prompt } = require('enquirer');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); // Use CommonJS require for chalk

// Get the current Git username, if available
let defaultUsername = '';
try {
    defaultUsername = execSync('git config user.name').toString().trim();
} catch (error) {
    console.log(chalk.red('🚲 getGitHubUsername :: Error: No Git username found in the current configuration.'));
}

// Prompt for GitHub username with a default value
const getGitHubUsername = async () => {
    const response = await prompt({
        type: 'input',
        name: 'username',
        message: `Enter GitHub username to fetch repository list`,
        initial: defaultUsername
    });
    return response.username || defaultUsername;
};

const fetchRepositories = (username) => {
    return new Promise((resolve, reject) => {
        const url = `https://api.github.com/users/${username}/repos`;
        const options = { headers: { 'User-Agent': 'npm-workspacer' } };

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

const selectRepositories = async (repoUrls) => {
    const response = await prompt({
        type: 'multiselect',
        name: 'selectedUrls',
        message: 'Select repositories you want to use:',
        choices: repoUrls
    });
    return response.selectedUrls;
};

const cloneRepository = (url, targetDir) => {
    return new Promise((resolve, reject) => {
        console.log(chalk.blue(`🚲 cloneRepository :: Cloning ${url} into ${targetDir}...`));

        if (fs.existsSync(targetDir)) {
            console.log(chalk.yellow(`🚲 cloneRepository :: Directory ${targetDir} already exists, updating with git fetch and git pull.`));
            exec(`git -C ${targetDir} fetch && git -C ${targetDir} pull`, (error, stdout, stderr) => {
                if (error) {
                    reject(chalk.red(`🚲 cloneRepository :: Error updating ${url}: ${stderr}`));
                } else {
                    console.log(chalk.green(`🚲 cloneRepository :: Successfully updated ${url}`));
                    resolve();
                }
            });
        } else {
            exec(`git clone ${url} ${targetDir}`, (error, stdout, stderr) => {
                if (error) {
                    reject(chalk.red(`🚲 cloneRepository :: Error cloning ${url}: ${stderr}`));
                } else {
                    console.log(chalk.green(`🚲 cloneRepository :: Successfully cloned ${url}`));
                    resolve();
                }
            });
        }
    });
};

const promptForPrefix = async (defaultPrefix) => {
    const response = await prompt({
        type: 'input',
        name: 'prefix',
        message: `What prefix should run commands have?`,
        initial: defaultPrefix
    });

    return response.prefix || defaultPrefix;
};

const scanForMissingPackageJson = () => {
    const packagesDir = path.join(__dirname, 'packages');
    console.log(chalk.blue(`🔍 scanForMissingPackageJson :: Scanning ${packagesDir} for missing package.json files...`));
    const folders = fs.readdirSync(packagesDir).filter((file) => fs.statSync(path.join(packagesDir, file)).isDirectory());

    const missingPackageJson = folders.filter((folder) => !fs.existsSync(path.join(packagesDir, folder, 'package.json')));

    return missingPackageJson;
};

const createPackageJson = (folder) => {
    const targetDir = path.join(__dirname, 'packages', folder);
    console.log(chalk.blue(`📦 createPackageJson :: Creating package.json in ${targetDir}...`));

    exec(`npm init -y`, { cwd: targetDir }, (error, stdout, stderr) => {
        if (error) {
            console.error(chalk.red(`📦 createPackageJson :: Error creating package.json in ${folder}: ${stderr}`));
        } else {
            console.log(chalk.green(`📦 createPackageJson :: Successfully created package.json in ${folder}`));
        }
    });
};

const promptForCommands = async () => {
    let commands = '';
    while (!commands) {
        const response = await prompt({
            type: 'input',
            name: 'commands',
            message: 'List the commands you would like to create, delimited by comma (e.g., build, test, deploy):',
        });
        commands = response.commands.trim();
        if (!commands) {
            console.log(chalk.red('🚛 promptForCommands :: No commands entered, please try again.'));
        }
    }
    return commands.split(',').map(cmd => cmd.trim());
};

const updateRootPackageJson = (commands, prefix) => {
    const rootPackageJsonPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(rootPackageJsonPath)) {
        const packageJson = require(rootPackageJsonPath);

        commands.forEach(command => {
            packageJson.scripts[command] = `npm run ${prefix}:${command} -w /packages/*`;
        });

        fs.writeFileSync(rootPackageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(chalk.green(`🚛 updateRootPackageJson :: Updated package.json with commands.`));
    } else {
        console.log(chalk.red('🚛 updateRootPackageJson :: root package.json not found.'));
    }
};

(async () => {
    const githubUsername = await getGitHubUsername();
    if (!githubUsername) {
        console.log(chalk.red('🚲 getGitHubUsername :: Error: No username provided and no default Git username found.'));
        process.exit(1);
    }

    try {
        const repos = await fetchRepositories(githubUsername);
        if (repos && repos.length) {
            const repoUrls = repos.map(repo => repo.clone_url);

            let selectedUrls = await selectRepositories(repoUrls);

            if (selectedUrls.length === 0) {
                console.log(chalk.red('🚲 selectRepositories :: No repositories selected, closing workspacer.'));
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

            console.log();  // Line break after cloning

            const currentRepoName = path.basename(__dirname);
            const prefix = await promptForPrefix(currentRepoName);
            console.log(chalk.green(`🚛 promptForPrefix :: Selected prefix for commands: ${prefix}`));

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
                console.log(chalk.green('🚛 createPackageJson :: All repositories already have a package.json file.'));
            }

            // Prompt for the commands
            const commands = await promptForCommands();

            // Update the root package.json with the commands
            updateRootPackageJson(commands, prefix);

        } else {
            console.log(chalk.red('🚲 fetchRepositories :: No repositories found for user.'));
        }
    } catch (error) {
        console.error(chalk.red(`🚲 main :: Error fetching repositories: ${error.message}`));
    }
})();
