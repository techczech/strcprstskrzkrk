# Strč prst skrz krk - Czech Tongue Twister App

A fun, interactive web application designed to help users master difficult Czech pronunciation through gamified tongue twisters.

## 🏗 Architecture

The application is built as a Single Page Application (SPA) using React and TypeScript. It leverages modern web standards and AI services to provide immediate feedback and practice tools.

### Core Stack
- **Frontend Framework**: React 19 (via ESM imports)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (via CDN)
- **Audio Processing**: Native Web Audio API (`AudioContext`, `AnalyserNode`)
- **AI Integration**: Google GenAI SDK (`@google/genai`) using Gemini 2.5 Flash for Text-to-Speech generation.

### Key Components

1.  **View Layer**:
    -   `App.tsx`: Main entry point, handles routing (simple state-based), hero section, and the main list of twisters.
    -   `PracticeMode.tsx`: A modal overlay that guides the user through the "back-chaining" learning method (breaking phrases into smaller chunks).
    -   `AudioPlayer.tsx`: A reusable component utilizing `Canvas API` to visualize audio frequency data while playing.

2.  **Data Layer**:
    -   `constants.ts`: Contains the static database of tongue twisters, linguistic breakdowns, and translations.
    -   `types.ts`: TypeScript interfaces ensuring type safety across the domain models (TwisterContent, Progress, ViewModels).

3.  **Services**:
    -   `geminiService.ts`: Handles communication with the Google Gemini API. It generates audio for specific word chunks dynamically if static audio isn't available, caching results in `localStorage` to reduce API calls.
    -   `audioService.ts`: Utilities for fetching and decoding static MP3 assets.
    -   `storageService.ts`: Simple persistence layer using `localStorage` to track user completion statistics.

### Audio Pipeline
The app uses a hybrid audio approach:
- **Static Assets**: High-quality, human-recorded full sentences are loaded from static paths.
- **Dynamic AI Generation**: Intermediate practice steps (individual words or partial phrases) are generated on-the-fly using Gemini's TTS capabilities (`gemini-2.5-flash-preview-tts`).
- **User Recording**: Uses `navigator.mediaDevices.getUserMedia` to record user attempts, which are immediately decoded into an `AudioBuffer` for instant playback and comparison.

## 🚀 Deployment

### Prerequisites
- A Google Cloud Project with the Gemini API enabled.
- An API Key with access to the `gemini-2.5-flash-preview-tts` model.

### Environment Configuration
The application expects the API key to be available via `process.env.API_KEY`. 
- **Development/AI Studio**: This is injected automatically.
- **Production (Vite/Webpack)**: You must configure your bundler to replace `process.env.API_KEY` with your actual key. Note that purely client-side API keys should be restricted by HTTP Referrer in the Google Cloud Console to prevent misuse.

### Running Locally
This project uses a browser-native ES Module approach via `importmap` in `index.html`.

To serve locally:
1.  Clone the repository.
2.  Serve the root directory using a static file server (e.g., `npx http-server .`).
3.  Open the local server URL.

### Deployment Targets
The app is static and can be deployed to:
- GitHub Pages
- Vercel
- Netlify
- Firebase Hosting
