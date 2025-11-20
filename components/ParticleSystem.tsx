import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { ParticleConfig } from '../types';

interface ParticleSystemProps {
  imageUrl: string;
  config: ParticleConfig;
}

interface GeometryData {
  positions: Float32Array;
  colors: Float32Array;
  brightness: Float32Array; // Separate attribute for brightness/depth
  randoms: Float32Array;    // Random seed for shader noise
  density: number;
  src: string;
}

// --- Shader Definitions ---

const vertexShader = `
  uniform float uTime;
  uniform float uDepth;
  uniform float uDispersion;
  uniform float uSize;

  attribute float aBrightness;
  attribute float aRandom;
  attribute vec3 aColor;

  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec3 pos = position;

    // 1. Calculate Z-depth based on brightness
    float z = aBrightness * uDepth;

    // 2. Dispersion / Explosion Logic
    // We replace the JS Math.sin/cos noise with GLSL using the stable aRandom attribute
    if (uDispersion > 0.0) {
      float spread = uDispersion * 2.0;
      
      // Create noise based on random seed and time
      float noiseX = sin(aRandom * 100.0 + uTime * 2.0) * cos(aRandom * 200.0);
      float noiseY = cos(aRandom * 100.0 + uTime * 2.0) * sin(aRandom * 200.0);
      
      // Apply spread
      pos.x += noiseX * spread * aRandom; 
      pos.y += noiseY * spread * aRandom;
      
      // Explode Z axis slightly too
      z += (aRandom - 0.5) * spread * 5.0;
    }

    // 3. Waving Effect (Sine wave across X axis)
    z += sin(pos.x * 0.05 + uTime) * 1.5;

    pos.z = z;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation (particles get smaller when further away)
    gl_PointSize = uSize * (300.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  uniform float uBrightness;
  varying vec3 vColor;

  void main() {
    // Create a circular soft particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (length(coord) > 0.5) discard;

    // Output color multiplied by global brightness
    gl_FragColor = vec4(vColor * uBrightness, 0.85);
  }
`;

// --- Caching System ---
const geometryCache = new Map<string, GeometryData>();

// Helper to load image and extract pixel data
const loadImageData = (src: string, density: number): Promise<GeometryData> => {
  const cacheKey = `${src}-${density}`;

  // Check Cache
  if (geometryCache.has(cacheKey)) {
    return Promise.resolve(geometryCache.get(cacheKey)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    // Logic to determine if proxy is needed
    // Blob URLs (user uploads) and Data URLs do not need a proxy
    const isLocal = src.startsWith('blob:') || src.startsWith('data:');
    const proxyUrl = isLocal ? src : `https://wsrv.nl/?url=${encodeURIComponent(src)}&output=jpg`;
    
    img.src = proxyUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error("Failed to get 2D context"));
          return;
        }

        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const positions: number[] = [];
        const colors: number[] = [];
        const brightnessArr: number[] = [];
        const randoms: number[] = [];

        // Calculate center offset
        const cx = width / 2;
        const cy = height / 2;

        // Calculate step based on density config
        const safeDensity = Math.max(0.5, Math.min(10, density));
        let step = Math.max(1, Math.round(6 / safeDensity));
        
        if (width * height > 2000000 && step < 2) step = 2;

        const scale = 0.1; // Scale down the world unit size

        for (let y = 0; y < height; y += step) {
          for (let x = 0; x < width; x += step) {
            const i = (y * width + x) * 4;
            
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            const a = data[i + 3] / 255;

            if (a < 0.1) continue; 

            const brightVal = (r + g + b) / 3;

            // Static Grid Position
            positions.push((x - cx) * scale, -(y - cy) * scale, 0);
            
            // Attributes
            colors.push(r, g, b);
            brightnessArr.push(brightVal);
            randoms.push(Math.random()); // Stable random value for shader noise
          }
        }

        const result: GeometryData = {
          positions: new Float32Array(positions),
          colors: new Float32Array(colors),
          brightness: new Float32Array(brightnessArr),
          randoms: new Float32Array(randoms),
          density: density,
          src: src
        };

        // Update Cache
        geometryCache.set(cacheKey, result);
        
        // Optional: Limit cache size (simple LRU-like clearing if too big)
        if (geometryCache.size > 10) {
           const firstKey = geometryCache.keys().next().value;
           if (firstKey) geometryCache.delete(firstKey);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      console.error("Image loading error", e);
      reject(new Error(`Failed to load image`));
    };
  });
};

const ParticleSystem: React.FC<ParticleSystemProps> = ({ imageUrl, config }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const [geometryData, setGeometryData] = useState<GeometryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load and process image when URL changes or density changes
  useEffect(() => {
    setError(null);
    let isMounted = true;

    loadImageData(imageUrl, config.density)
      .then((data) => {
        if (isMounted) {
          setGeometryData(data);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("Failed to load image particles", err);
          setError(err.message);
          setGeometryData(null);
        }
      });

      return () => { isMounted = false; };
  }, [imageUrl, config.density]);

  // Initialize Uniforms object for Shader
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDepth: { value: config.depth },
    uDispersion: { value: config.dispersion },
    uBrightness: { value: config.brightness },
    uSize: { value: config.size }
  }), []);

  // Update uniforms every frame (GPU animation)
  useFrame((state) => {
    if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        // We update these frame-by-frame to allow smooth transitions if we wanted to interpolate,
        // but mainly to ensure the shader stays in sync with React state without recreating the material.
        materialRef.current.uniforms.uDepth.value = config.depth;
        materialRef.current.uniforms.uDispersion.value = config.dispersion;
        materialRef.current.uniforms.uBrightness.value = config.brightness;
        materialRef.current.uniforms.uSize.value = config.size;
    }
  });

  if (error) {
     return (
        <Text color="red" fontSize={1} position={[0, 0, 0]}>
           {error}
        </Text>
     )
  }

  // Strict sync check
  if (!geometryData || geometryData.density !== config.density || geometryData.src !== imageUrl) return null;

  return (
    <points ref={pointsRef} key={`${geometryData.src}-${geometryData.density}`}>
       <bufferGeometry>
        {/* Pass all attributes to the Vertex Shader */}
        <bufferAttribute
            attach="attributes-position"
            count={geometryData.positions.length / 3}
            array={geometryData.positions}
            itemSize={3}
        />
        <bufferAttribute
            attach="attributes-aColor" // Note: 'color' attribute name is reserved in some Three versions, but 'aColor' is safer for custom shaders
            count={geometryData.colors.length / 3}
            array={geometryData.colors}
            itemSize={3}
        />
        <bufferAttribute
            attach="attributes-aBrightness"
            count={geometryData.brightness.length}
            array={geometryData.brightness}
            itemSize={1}
        />
        <bufferAttribute
            attach="attributes-aRandom"
            count={geometryData.randoms.length}
            array={geometryData.randoms}
            itemSize={1}
        />
      </bufferGeometry>
      
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleSystem;