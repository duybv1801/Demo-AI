// app.js
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';

import { getPullRequestDetails, addPullRequestComment } from './services/githubService.js';
import { getAiReview } from './services/aiService.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

import crypto from 'crypto';

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

app.post('/webhook', async (req, res) => {
    const githubEvent = req.headers['x-github-event'];
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);

    if (GITHUB_WEBHOOK_SECRET) {
        const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
        const digest = 'sha256=' + hmac.update(payload).digest('hex');
        if (signature !== digest) {
            console.warn('Invalid webhook signature');
            return res.status(401).send('Invalid signature');
        }
    }

    console.log(`Received GitHub event: ${githubEvent}`);

    if (githubEvent === 'pull_request') {
        const { action, pull_request, repository } = req.body;

        if (['opened', 'reopened', 'synchronize'].includes(action)) {
            const owner = repository.owner.login;
            const repo = repository.name;
            const pull_number = pull_request.number;

            console.log(`Processing PR #${pull_number} for ${owner}/${repo}`);
            
            try {
                const { diff } = await getPullRequestDetails(owner, repo, pull_number);

                console.log('Requesting AI review...');
                const aiReviewComment = await getAiReview(diff);

                await addPullRequestComment(owner, repo, pull_number, `**AI Code Review:**\n\n${aiReviewComment}`);
                console.log(`AI review successfully added to PR #${pull_number}`);
            } catch (error) {
                console.error(`Failed to process PR #${pull_number}: ${error.message}`);
                await addPullRequestComment(owner, repo, pull_number, `**AI Code Review Failed:**\n\nI encountered an error while reviewing this PR:\n\`\`\`\n${error.message}\n\`\`\`\nPlease check the server logs for more details.`);
            }
        }
    }

    res.status(200).send('Webhook received and processed');
});

// Basic route
app.get('/', (req, res) => {
    res.send('AI PR Reviewer Agent is running!');
});

// Start server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// Export app (ESM way)
export default app;
