# 💊 MedTrack - Medication Interaction Tracker

**MedTrack** is a React-based web application for tracking patient medications and identifying potential drug interactions using a searchable drug database and interaction dataset.

![MedTrack Screenshot](https://github.com/seanwessmith/medtrack/screenshot.png)

## Features

- ✅ Add medications with name, dosage, frequency, prescriber, and date
- 🔍 Live search with real-time filtering from a remote medication database
- 💥 Automatic detection of potential drug interactions
- 📊 Event tracking with PostHog for analytics
- 💅 Modern and responsive UI built with Tailwind CSS and Lucide icons

## Demo

https://medications.pages.dev/

## Tech Stack

- **React** (w/ hooks)
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **PostHog** for analytics
- **Public JSON APIs** (served via R2) for medications and interactions

## Installation

```bash
git clone https://github.com/your-username/medtrack.git
cd medtrack
npm install
npm run dev