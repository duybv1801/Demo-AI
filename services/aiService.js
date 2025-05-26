// services/aiService.js
import axios from 'axios';

export async function getAiReview(codeDiff) {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }

    const prompt = `Review the following code changes and provide concise feedback on potential issues, improvements, or best practices. Focus on readability, maintainability, security, and performance. Highlight any specific lines or sections if possible.

\`\`\`diff
${codeDiff.substring(0, 15000)}
\`\`\`

Provide your review in a clear, constructive manner.`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant specialized in code review. Provide concise and constructive feedback.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 1000,
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error getting AI review:', error.response ? error.response.data : error.message);
        throw error;
    }
}
