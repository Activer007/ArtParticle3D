export interface Painting {
  id: string;
  title: string;
  artist: string;
  url: string; // Image URL
  year: string;
}

export interface ParticleConfig {
  size: number;
  depth: number; // Z-axis displacement intensity
  density: number; // Skip pixels to reduce load
  dispersion: number; // Random scatter effect
  brightness: number; // Global brightness multiplier
}

export interface AIResponse {
  analysis: string;
  mood: string;
}