# ResearchHelper Backend

This is the Express.js backend for the Research Intelligence Platform.

## Architecture

- **Server:** Node.js with Express
- **Database:** MongoDB and Mongoose (using GridFS for report storage)
- **Queues:** BullMQ & Redis for background workers (Scraping, AI, PDF Generation)
- **Scraping Tools:** Cheerio, Playwright, XML2JS

## Setup & Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure you have a running MongoDB instance and a Redis instance (for BullMQ).

3. Create a `.env` file and fill in the required values (MongoDB URI, Redis URL, JWT Secret).

4. Start the backend in development mode:
   ```bash
   npm run dev
   ```

5. Or start the workers explicitly if decoupled:
   ```bash
   node src/workers/index.js
   ```
