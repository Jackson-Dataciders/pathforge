# pathforge

Self-managing learning platform: describe a topic in Obsidian, AI agents research, plan and build interactive courses and roadmaps.

## Development

Use Node.js 22. Install dependencies and start the development server with:

```sh
npm ci
npm run dev
```

Available checks and tools:

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run format
```

## Deployment

To deploy on Vercel:

1. Import the GitHub repository in Vercel.
2. Select Next.js as the framework preset.
3. Set the Node.js version to 22.
4. Set `main` as the production branch.
5. Create a GitHub OAuth App with the callback URL `https://<domain>/api/auth/callback/github`. For local development, also use `http://localhost:3000/api/auth/callback/github`.
6. Set `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `ALLOWED_GITHUB_USER_ID` in the Vercel project environment variables.
