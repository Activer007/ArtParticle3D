import React, { useEffect, useRef, useState } from 'react';
import { AudioData, Track } from '../types';

interface AudioPlayerProps {
  audioDataRef: React.MutableRefObject<AudioData>;
}

// Using Wikimedia Commons transcoded MP3s for better browser compatibility (Safari often struggles with OGG)
const PLAYLIST: Track[] = [
  {
    title: "Gymnopédie No. 1",
    artist: "Erik Satie",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/3/35/Gymnopedie_No_1.ogg/Gymnopedie_No_1.ogg.mp3"
  },
  {
    title: "Clair de Lune",
    artist: "Claude Debussy",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2f/Clair_de_lune_%28Debussy%29_Suite_bergamasque.ogg/Clair_de_lune_%28Debussy%29_Suite_bergamasque.ogg.mp3"
  },
  {
    title: "Moonlight Sonata",
    artist: "Ludwig van Beethoven",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/eb/Beethoven_Moonlight_1st_movement.ogg/Beethoven_Moonlight_1st_movement.ogg.mp3"
  }
];

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioDataRef }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const currentTrack = PLAYLIST[currentTrackIndex];

  const initAudio = () => {
    if (isInitialized || !audioRef.current) return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContext();
    
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    
    const source = audioCtx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyserRef.current = analyser;
    sourceRef.current = source;
    setIsInitialized(true);
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (!isInitialized) {
      initAudio();
    }

    // Resume context if suspended (browser policy)
    if (analyserRef.current?.context.state === 'suspended') {
      await (analyserRef.current.context as AudioContext).resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (e) {
        console.error("Playback failed", e);
        setIsPlaying(false);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    const next = (currentTrackIndex + 1) % PLAYLIST.length;
    setCurrentTrackIndex(next);
    setIsPlaying(true); // Auto play next
  };

  const prevTrack = () => {
    const prev = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentTrackIndex(prev);
    setIsPlaying(true);
  };

  // Analysis Loop
  const analyze = () => {
    if (analyserRef.current && isPlaying) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Simple frequency band splitting
      // fftSize 512 -> 256 bins.
      // SampleRate ~44100. Bin width ~172Hz.
      
      // Bass: indices 0-4 (~0 - 800Hz)
      let bassSum = 0;
      for (let i = 0; i < 5; i++) bassSum += dataArray[i];
      const low = (bassSum / 5) / 255;

      // Mids: indices 5-20 (~800 - 3500Hz)
      let midSum = 0;
      for (let i = 5; i < 20; i++) midSum += dataArray[i];
      const mid = (midSum / 15) / 255;

      // Highs: indices 20-100 (~3500Hz+)
      let highSum = 0;
      for (let i = 20; i < 100; i++) highSum += dataArray[i];
      const high = (highSum / 80) / 255;

      // Smooth damping could be done here, but we'll write raw normalized values
      audioDataRef.current = { low, mid, high };
    } else if (!isPlaying) {
      // Decay to zero if paused
      const current = audioDataRef.current;
      audioDataRef.current = {
        low: current.low * 0.9,
        mid: current.mid * 0.9,
        high: current.high * 0.9
      };
    }

    requestRef.current = requestAnimationFrame(analyze);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(analyze);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying]);

  // Auto-play when track changes if was playing
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.src = currentTrack.url;
        if (isPlaying) {
            audioRef.current.play().catch((e) => {
              console.warn("Autoplay blocked or failed", e);
              setIsPlaying(false);
            });
        }
    }
  }, [currentTrackIndex]);

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error("Audio resource failed to load", e);
    setIsPlaying(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Audio Symphony</h3>
      
      <div className="flex flex-col gap-2 bg-black/40 rounded-lg p-3 border border-white/5">
        <div className="flex items-center justify-between">
            <div className="truncate pr-2">
                <div className="text-xs font-bold text-white truncate">{currentTrack.title}</div>
                <div className="text-[10px] text-gray-400 truncate">{currentTrack.artist}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
               <button onClick={prevTrack} className="p-1 hover:text-blue-400 text-gray-300">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
               </button>
               <button onClick={togglePlay} className="p-1.5 bg-white text-black rounded-full hover:bg-blue-400 transition-colors">
                  {isPlaying ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                      <svg className="w-3 h-3 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
               </button>
               <button onClick={nextTrack} className="p-1 hover:text-blue-400 text-gray-300">
                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
               </button>
            </div>
        </div>
        
        {/* Simple Visualizer Bars */}
        <div className="flex items-end justify-between h-6 gap-0.5 mt-1 opacity-80">
             {/* Use state-independent CSS animation for visual flair that pauses when stopped */}
             <div className={`bg-blue-500 w-1/3 rounded-t-sm transition-all duration-75 ${isPlaying ? 'animate-pulse' : 'h-1'}`} style={{ height: isPlaying ? '80%' : '10%' }}></div>
             <div className={`bg-purple-500 w-1/3 rounded-t-sm transition-all duration-100 ${isPlaying ? 'animate-pulse delay-75' : 'h-1'}`} style={{ height: isPlaying ? '60%' : '10%' }}></div>
             <div className={`bg-pink-500 w-1/3 rounded-t-sm transition-all duration-150 ${isPlaying ? 'animate-pulse delay-150' : 'h-1'}`} style={{ height: isPlaying ? '90%' : '10%' }}></div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        crossOrigin="anonymous" 
        onEnded={nextTrack} 
        onError={handleAudioError}
      />
    </div>
  );
};

export default AudioPlayer;