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
