// services/githubService.js
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export async function getPullRequestDetails(owner, repo, pull_number) {
    try {
        const { data: pullRequest } = await octokit.pulls.get({
            owner,
            repo,
            pull_number,
        });

        const { data: files } = await octokit.pulls.listFiles({
            owner,
            repo,
            pull_number,
        });

        const { data: diff } = await octokit.pulls.get({
            owner,
            repo,
            pull_number,
            headers: {
                Accept: 'application/vnd.github.v3.diff',
            },
        });

        return { pullRequest, files, diff };
    } catch (error) {
        console.error(`Error fetching PR details: ${error.message}`);
        throw error;
    }
}

export async function addPullRequestComment(owner, repo, pull_number, body) {
    try {
        await octokit.issues.createComment({
            owner,
            repo,
            issue_number: pull_number,
            body,
        });
        console.log(`Comment added to PR #${pull_number}`);
    } catch (error) {
        console.error(`Error adding PR comment: ${error.message}`);
        throw error;
    }
}
