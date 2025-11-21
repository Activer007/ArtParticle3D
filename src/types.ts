
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
  useSemanticDepth?: boolean; // Enable smart depth based on color theory
}

export interface AIResponse {
  analysis: string;
  mood: string;
}

export interface AudioData {
  low: number;  // 0.0 - 1.0
  mid: number;  // 0.0 - 1.0
  high: number; // 0.0 - 1.0
}

export interface Track {
  title: string;
  artist: string;
  sources: {
    url: string;
    type: string;
  }[];
}
