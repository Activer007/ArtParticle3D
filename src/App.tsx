import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Painting, ParticleConfig, AIResponse, AudioData } from './types';
import { analyzePainting } from './services/geminiService';
import ParticleSystem from './components/ParticleSystem';
import Controls from './components/Controls';
import AudioPlayer from './components/AudioPlayer';

// Pre-defined list of masterpieces (using Wikimedia Commons for CORS friendliness)
const DEFAULT_PAINTINGS: Painting[] = [
  {
    id: 'starry-night',
    title: 'The Starry Night',
    artist: 'Vincent van Gogh',
    year: '1889',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1024px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg'
  },
  {
    id: 'mona-lisa',
    title: 'Mona Lisa',
    artist: 'Leonardo da Vinci',
    year: '1503',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg'
  },
  {
    id: 'wave',
    title: 'Great Wave off Kanagawa',
    artist: 'Hokusai',
    year: '1831',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Great_Wave_off_Kanagawa2.jpg/1024px-Great_Wave_off_Kanagawa2.jpg'
  },
  {
    id: 'venus-de-milo',
    title: 'Venus de Milo',
    artist: 'Alexandros of Antioch',
    year: 'c. 101 BC',
    url: 'https://d1inegp6v2yuxm.cloudfront.net/royal-academy/image/upload/c_limit,cs_tinysrgb,dn_72,f_auto,fl_progressive.keep_iptc,w_1200/yq3ruckksdsdq0njjoqn.jpeg'
  }
];

const App: React.FC = () => {
  const [paintings, setPaintings] = useState<Painting[]>(DEFAULT_PAINTINGS);
  const [selectedPainting, setSelectedPainting] = useState<Painting>(DEFAULT_PAINTINGS[0]);
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // Ref for shared audio analysis data (avoids re-renders)
  const audioDataRef = useRef<AudioData>({ low: 0, mid: 0, high: 0 });

  const [config, setConfig] = useState<ParticleConfig>({
    size: 0.8,
    depth: 15, // How much "3D" pop it has based on brightness
    density: 1.5, // Set to 1.5 to enhance the 3D point-cloud aesthetic
    dispersion: 0,
    brightness: 1.2 // Default slight boost
  });

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const newPainting: Painting = {
      id: `custom-${Date.now()}`,
      title: file.name.split('.')[0] || 'Custom Upload',
      artist: 'User Upload',
      year: new Date().getFullYear().toString(),
      url: url
    };

    setPaintings(prev => [...prev, newPainting]);
    setSelectedPainting(newPainting);
  };

  // Fetch AI Analysis when painting changes
  useEffect(() => {
    const fetchAI = async () => {
      // Handle Custom Images - Skip API call
      if (selectedPainting.id.startsWith('custom-')) {
        setAiData({
          analysis: "This is a custom image uploaded by you. Explore its 3D structure by rotating the view and adjusting the Depth slider!",
          mood: "Personal, Unique, Creative"
        });
        return;
      }

      setIsLoadingAI(true);
      setAiData(null);
      try {
        const result = await analyzePainting(selectedPainting);
        setAiData(result);
      } catch (e) {
        console.error(e);
        setAiData({ analysis: "Gemini is taking a nap. Try again later!", mood: "Sleepy" });
      } finally {
        setIsLoadingAI(false);
      }
    };

    fetchAI();
  }, [selectedPainting]);

  return (
    <div className="relative w-full h-full bg-gray-900">
      
      <Controls 
        paintings={paintings}
        selectedPainting={selectedPainting}
        onSelectPainting={setSelectedPainting}
        onUpload={handleImageUpload}
        config={config}
        onConfigChange={setConfig}
        aiData={aiData}
        isLoadingAI={isLoadingAI}
      >
        {/* Inject AudioPlayer inside the Controls sidebar */}
        <AudioPlayer audioDataRef={audioDataRef} />
      </Controls>

      <Canvas
        camera={{ position: [0, 0, 180], fov: 50 }} // Moved back to 180 to ensure full image visibility
        dpr={[1, 2]} // Handle high DPI screens
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#050505']} />
        
        <Suspense fallback={null}>
            <Stars radius={150} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
            <group position={[0, 0, 0]}>
               <ParticleSystem 
                  imageUrl={selectedPainting.url} 
                  config={config}
                  audioDataRef={audioDataRef}
               />
            </group>
        </Suspense>

        <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            autoRotate={config.dispersion > 2} // Auto rotate if effect is intense
            autoRotateSpeed={0.5}
            zoomSpeed={0.8}
            rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default App;