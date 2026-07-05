# Research Intelligence Platform

A full-stack MERN platform designed for academic paper discovery, verification, and AI-assisted literature review generation. It leverages free APIs and web scrapers to gather academic papers and utilizes a robust background worker architecture for data processing.

## Architecture

- **Frontend:** React, Vite, Tailwind CSS v4, Shadcn UI
- **Backend:** Express.js, Node.js
- **Database:** MongoDB (with GridFS for storing reports)
- **Caching & Queues:** Redis & BullMQ
- **Scraping Sources:** arXiv, CrossRef, Google Scholar, Semantic Scholar, PubMed

## Features

- **Search & Discovery:** Search for papers across multiple academic sources.
- **File Explorer:** Browse, preview, and download generated reports via a built-in file explorer.
- **Citation Export:** Generate citations in APA, IEEE, MLA, Chicago, and BibTeX.
- **AI Integration (Optional):** Literature review and trends analysis using OpenAI.

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express application

## Getting Started

Please see the `README.md` files in the `/client` and `/server` directories for specific instructions on running each service locally.
