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
  density: number;
  src: string;
}

// Helper to load image and extract pixel data
const loadImageData = (src: string, density: number): Promise<GeometryData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    // Use wsrv.nl as a CORS proxy to ensure we get proper headers for canvas manipulation
    // This fixes "Tainted canvas" and CORS errors on strict environments
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(src)}&output=jpg`;
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

        // Calculate center offset
        const cx = width / 2;
        const cy = height / 2;

        // Calculate step based on density config
        const safeDensity = Math.max(0.5, Math.min(10, density));
        let step = Math.max(1, Math.round(6 / safeDensity));
        
        // Safety cap for very large images
        if (width * height > 2000000 && step < 2) step = 2;

        const scale = 0.1; // Scale down the world unit size

        for (let y = 0; y < height; y += step) {
          for (let x = 0; x < width; x += step) {
            const i = (y * width + x) * 4;
            
            // Extract RGBA
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            const a = data[i + 3] / 255;

            if (a < 0.1) continue; // Skip transparent pixels

            // Calculate brightness for Z-displacement
            const brightness = (r + g + b) / 3;

            // Push position (centered)
            // We store the 'base' z position as the brightness value temporarily 
            // so we can use it in the animation loop to calculate depth
            positions.push((x - cx) * scale, -(y - cy) * scale, brightness); 
            
            colors.push(r, g, b);
          }
        }

        resolve({
          positions: new Float32Array(positions),
          colors: new Float32Array(colors),
          density: density, // Return the density used to generate this data
          src: src // Return the original source url
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      console.error("Image loading error", e);
      reject(new Error(`Failed to load image via proxy`));
    };
  });
};

const ParticleSystem: React.FC<ParticleSystemProps> = ({ imageUrl, config }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const [geometryData, setGeometryData] = useState<GeometryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load and process image when URL changes or density changes
  useEffect(() => {
    // We do not clear geometryData immediately to null to avoid flash, 
    // but we must handle the data mismatch in rendering.
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

  // Animation loop for dynamic effects
  useFrame((state) => {
    // Guard clause: If refs aren't ready or data doesn't match current config, skip frame
    // We must check src match to avoid animating stale data before unmount
    if (!pointsRef.current || !geometryData || geometryData.density !== config.density || geometryData.src !== imageUrl) return;
    
    const time = state.clock.getElapsedTime();
    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const basePositions = geometryData.positions;
    
    const count = basePositions.length / 3;
    
    // Safety check to prevent out of bounds if buffers are mismatched during a race condition
    if (positions.length !== basePositions.length) return;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const brightness = basePositions[i3 + 2]; // Stored brightness from loader
      
      // Reset X, Y from base
      positions[i3] = basePositions[i3];
      positions[i3 + 1] = basePositions[i3 + 1];
      
      // Calculate dynamic Z
      let z = brightness * config.depth;
      
      // Dispersion/Explosion effect
      if (config.dispersion > 0) {
        const noiseX = Math.sin(i * 0.1 + time * 2) * Math.cos(i * 0.2);
        const noiseY = Math.cos(i * 0.1 + time * 2) * Math.sin(i * 0.2);
        const randomFactor = (Math.sin(i * 78.233) + 1) * 0.5; 
        
        const spread = config.dispersion * 2;
        positions[i3] += noiseX * spread * randomFactor; 
        positions[i3+1] += noiseY * spread * randomFactor;
        z += (randomFactor - 0.5) * spread * 5;
      }

      // Waving effect based on position
      z += Math.sin(positions[i3] * 0.05 + time) * 1.5;

      positions[i3 + 2] = z;
    }
    
    geometry.attributes.position.needsUpdate = true;
  });

  if (error) {
     return (
        <Text color="red" fontSize={1} position={[0, 0, 0]}>
           {error}
        </Text>
     )
  }

  // Strict Data Synchronization:
  // Only render if we have data, AND that data matches the requested density, 
  // AND the data matches the current requested image.
  // This forces the component to yield null during transitions, preventing 
  // Three.js from attempting to resize buffers on an existing geometry.
  if (!geometryData || geometryData.density !== config.density || geometryData.src !== imageUrl) return null;

  return (
    <points ref={pointsRef} key={`${geometryData.src}-${geometryData.density}`}>
       <bufferGeometry>
        {/* Memoize attributes to avoid recreation on prop changes */}
        <BufferAttributes 
          positions={geometryData.positions} 
          colors={geometryData.colors} 
        />
      </bufferGeometry>
      {/* Use color prop to multiply vertex colors by brightness scalar */}
      <pointsMaterial
        vertexColors
        color={new THREE.Color(config.brightness, config.brightness, config.brightness)}
        size={config.size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
        opacity={0.85}
      />
    </points>
  );
};

// Separate component for attributes to strictly control updates
const BufferAttributes = React.memo(({ positions, colors }: { positions: Float32Array, colors: Float32Array }) => {
    const memoizedPositions = useMemo(() => new Float32Array(positions), [positions]);
    const memoizedColors = useMemo(() => new Float32Array(colors), [colors]);
    
    return (
        <>
        <bufferAttribute
            attach="attributes-position"
            count={memoizedPositions.length / 3}
            array={memoizedPositions}
            itemSize={3}
        />
        <bufferAttribute
            attach="attributes-color"
            count={memoizedColors.length / 3}
            array={memoizedColors}
            itemSize={3}
        />
        </>
    );
});

export default ParticleSystem;