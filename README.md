# ArtParticle 3D (名画粒子)

An interactive 3D point-cloud visualization of famous masterpieces. This application transforms 2D art into immersive 3D particle landscapes, allowing users to manipulate the view, adjust particle density/depth, and gain artistic insights powered by Google Gemini AI.

## Gallery


### Great Wave off Kanagawa (神奈川冲浪里)
![Great Wave Visualization](images/weave.jpg)

![Great Wave Visualization](images/weave2.jpg)

### Venus de Milo (断臂维纳斯)
![Venus de Milo Visualization](images/venus.jpg)

## Features

*   **3D Particle System**: Converts 2D images into 3D depth maps based on pixel luminance.
*   **Interactive Controls**:
    *   **Brightness**: Adjust scene lighting.
    *   **3D Depth**: Extrude particles to create relief maps.
    *   **Point Density**: Balance visual quality vs. performance.
    *   **Dispersion**: Create artistic explosion/scatter effects.
*   **AI Insights**: Uses Google Gemini to analyze the painting and provide mood summaries.
*   **CORS Proxy**: Implements robust image loading via proxies to handle cross-origin canvas data.

## Tech Stack

*   **Framework**: React 19
*   **3D Engine**: Three.js / @react-three/fiber
*   **AI**: Google Gemini API (@google/genai)
*   **Styling**: Tailwind CSS
*   **Build Tool**: Vite (implied)

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure the Gemini API key by copying `.env.example` to `.env` and setting the value:
   ```bash
   cp .env.example .env
   echo "GEMINI_API_KEY=your_key_here" >> .env
   ```
   When `GEMINI_API_KEY` is omitted, the app will skip remote Gemini calls and display a "未配置 API Key" notice in the Gemini Insight panel.
3. Start the dev server:
   ```bash
   npm run dev
   ```
