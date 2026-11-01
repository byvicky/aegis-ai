const simpleGit = require("simple-git");
const path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");

async function cloneRepository(repoUrl) {

    const git = simpleGit();

    const tempDir = path.join(
        __dirname,
        "../../temp"
    );

    await fs.ensureDir(tempDir);

    const repositoryId = uuidv4();

    const repositoryPath = path.join(
        tempDir,
        repositoryId
    );

    console.log("Pasta de destino:");
    console.log(repositoryPath);

    await git.clone(
        repoUrl,
        repositoryPath
    );

    return repositoryPath;
}

module.exports = {
    cloneRepository,

    async removeRepository(repositoryPath) {
        if (repositoryPath) {
            await fs.remove(repositoryPath);
        }
    }
};
