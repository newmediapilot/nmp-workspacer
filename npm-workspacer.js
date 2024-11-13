const https = require('https');
const { execSync, exec } = require('child_process');
const { prompt } = require('enquirer');
const fs = require('fs');
const path = require('path');

// Get the current Git username, if available
let defaultUsername = '';
try {
    defaultUsername = execSync('git config user.name').toString().trim();
} catch (error) {
    console.log('No Git username found in the current configuration.');
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
        }).on('error', reject);
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

const confirmCloneAll = async () => {
    const response = await prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clone all the repositories?'
    });
    return response.confirm;
};

const cloneRepository = (url, targetDir) => {
    console.log(`Cloning ${url} into ${targetDir}...`);
    exec(`git clone ${url} ${targetDir}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error cloning ${url}: ${stderr}`);
        } else {
            console.log(`Successfully cloned ${url}`);
        }
    });
};

const promptForPrefix = async (defaultPrefix) => {
    console.log(
        `By default, we will create linking commands between your workspace and the cloned repositories.\n` +
        `These commands will be prefixed with the repository name (e.g., ${defaultPrefix}:build, ${defaultPrefix}:test).\n` +
        `If you'd prefer a custom prefix, you can set it now.`
    );

    const response = await prompt({
        type: 'input',
        name: 'prefix',
        message: `What prefix should run commands have? (${defaultPrefix})`,
        initial: defaultPrefix
    });

    return response.prefix || defaultPrefix;
};

(async () => {
    const githubUsername = await getGitHubUsername();
    if (!githubUsername) {
        console.log('No username provided and no default Git username found.');
        process.exit(1);
    }

    try {
        const repos = await fetchRepositories(githubUsername);
        if (repos && repos.length) {
            const repoUrls = repos.map(repo => repo.clone_url);

            let selectedUrls = await selectRepositories(repoUrls);

            // If no repositories are selected, confirm cloning all
            if (selectedUrls.length === 0) {
                const confirmAll = await confirmCloneAll();
                if (!confirmAll) {
                    // Return to the repository selector if user declines
                    selectedUrls = await selectRepositories(repoUrls);
                } else {
                    selectedUrls = repoUrls; // Set to all if confirmed
                }
            }

            // Ensure packages/ directory exists
            const packagesDir = path.join(__dirname, 'packages');
            if (!fs.existsSync(packagesDir)) {
                fs.mkdirSync(packagesDir);
            }

            // Clone each selected repository into packages/
            selectedUrls.forEach((url) => {
                const repoName = path.basename(url, '.git');
                const targetDir = path.join(packagesDir, repoName);
                cloneRepository(url, targetDir);
            });

            // Prompt for command prefix
            const firstRepoName = path.basename(selectedUrls[0], '.git');
            const prefix = await promptForPrefix(firstRepoName);
            console.log(`Selected prefix for commands: ${prefix}`);

        } else {
            console.log(`No repositories found for user '${githubUsername}' or user does not exist.`);
        }
    } catch (error) {
        console.error(`Error fetching repositories: ${error.message}`);
    }
})();
