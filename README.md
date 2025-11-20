# ArtParticle 3D (名画粒子)

An interactive 3D point-cloud visualization of famous masterpieces. This application transforms 2D art into immersive 3D particle landscapes, allowing users to manipulate the view, adjust particle density/depth, and gain artistic insights powered by Google Gemini AI.

## Gallery

### The Starry Night (星月夜)
![The Starry Night Visualization](https://file-s.s3.amazonaws.com/file/b5c471c3-076a-4295-9803-cf6804501c53)

### Great Wave off Kanagawa (神奈川冲浪里)
![Great Wave Visualization](https://file-s.s3.amazonaws.com/file/29736999-8e1d-434e-8413-868b57c10801)

### Venus de Milo (断臂维纳斯)
![Venus de Milo Visualization](https://file-s.s3.amazonaws.com/file/c8244662-960d-4577-b491-9dc7264f1285)

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
