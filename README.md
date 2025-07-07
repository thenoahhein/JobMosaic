# JobMosaic

AI-powered talent matching platform that connects AI engineers with recruiters using semantic search and automated scoring.

## Features

### For AI Engineer Candidates
- **Resume Upload**: Upload PDF résumés for AI analysis
- **Skill Extraction**: Automatic technical skill identification
- **Latent Score**: AI-generated score (0-100) for AI engineering roles
- **Auto-Matching**: Get discovered by recruiters automatically

### For Recruiters
- **Job Posting**: Post jobs with automatic embedding generation
- **Vector Search**: Find matching candidates using semantic similarity
- **Real-time Updates**: Live candidate list updates when new résumés match
- **Intro Requests**: Connect with candidates instantly

### Technology Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex (database, real-time, auth)
- **Authentication**: Clerk with role-based access
- **AI**: OpenAI GPT-4o for parsing, text-embedding-3-small for vector search
- **PDF Processing**: pdf-parse for text extraction

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- OpenAI API key
- Clerk account
- Convex account

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repo-url>
   cd nextjs-clerk-shadcn
   npm install
   ```

2. **Environment Variables**:
   The `.env.local` file contains your API keys. Update with your actual keys:
   ```bash
   # Already configured in .env.local:
   CONVEX_DEPLOYMENT=dev:acoustic-malamute-600
   NEXT_PUBLIC_CONVEX_URL=https://acoustic-malamute-600.convex.cloud
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   
   # You need to add your OpenAI key:
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start development servers**:
   ```bash
   # Option 1: Run both frontend and backend together
   npm run dev
   
   # Option 2: Run separately (in different terminals)
   npm run dev:frontend  # Next.js on http://localhost:3000
   npm run dev:backend   # Convex backend
   ```

### First Time Setup

1. **Clerk Configuration**: 
   - Clerk is already configured with the existing keys
   - No additional setup needed for development

2. **Convex Setup**:
   - Convex is already configured and connected
   - The schema includes users, candidates, jobs, and messages tables
   - Vector indexes are set up for semantic search

3. **OpenAI API Key**:
   - Sign up at https://platform.openai.com/
   - Generate an API key
   - Add it to `.env.local` as `OPENAI_API_KEY`

## Usage

### Candidate Flow
1. Sign up/sign in and select "AI Engineer Candidate"
2. Upload a PDF résumé on `/candidate/onboard`
3. View your parsed profile and latent score on `/candidate/profile`
4. Get matched automatically with recruiter job postings

### Recruiter Flow
1. Sign up/sign in and select "Recruiter" 
2. Access dashboard at `/recruiter/dashboard`
3. Post new jobs at `/recruiter/new-job`
4. View matching candidates at `/recruiter/jobs/[jobId]`
5. Send intro requests to candidates

## Architecture

### Database Schema
- **users**: Clerk ID and role (candidate/recruiter)
- **candidates**: Résumé text, embeddings, skills, latent scores
- **jobs**: Job descriptions, embeddings, status
- **messages**: Intro requests between recruiters and candidates

### AI Pipeline
1. **PDF → Text**: Extract text using pdf-parse
2. **Text → Structured Data**: GPT-4o function calling for skill extraction
3. **Text → Embeddings**: text-embedding-3-small for semantic search
4. **Scoring**: Nightly cron job using GPT-4o to rate candidates (0-100)
5. **Matching**: Vector similarity search between job and candidate embeddings

### Real-time Features
- Candidate lists update automatically when new résumés are uploaded
- Live matching as candidates upload résumés
- Instant intro request notifications

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
