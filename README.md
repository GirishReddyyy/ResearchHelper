# Research Intelligence Platform

A unified Next.js application designed for academic paper discovery, collaborative library management, and AI-assisted verification. This platform integrates web scraping and free academic APIs directly within the Next.js API routes, storing user data and saved libraries in MongoDB Atlas.

## Features

- **Paper Discovery:** Search across arXiv, CrossRef, DOAJ, and Semantic Scholar via built-in Next.js Serverless Functions.
- **Collaborative Library:** Save, organize, and view research papers stored seamlessly in MongoDB.
- **Citation Generation:** Export citations in APA, IEEE, MLA, Chicago, or BibTeX formats.
- **Vercel Ready:** Designed as a single, cohesive Next.js process optimized for one-click deployment on Vercel.

## Tech Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org)
- **Styling:** Tailwind CSS
- **Database:** MongoDB Atlas (via official `mongodb` Node driver)
- **Deployment:** Vercel

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory and configure your MongoDB connection and any optional keys:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/database
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **View the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured to be deployed out-of-the-box on [Vercel](https://vercel.com). Simply link your GitHub repository to a new Vercel project and it will automatically detect Next.js and handle the build process.
