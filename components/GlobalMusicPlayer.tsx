
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Disc3, Volume2, ChevronDown, SkipForward, AlertCircle } from 'lucide-react';

export const GlobalMusicPlayer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reliable sources (Archive.org stable download links)
  const playlist = [
    {
        title: "Daydreaming",
        artist: "HoliznaCC0",
        url: "https://archive.org/download/HoliznaCC0_-_Daydreaming/HoliznaCC0%20-%20Daydreaming.mp3"
    },
    {
        title: "Letting Go",
        artist: "HoliznaCC0",
        url: "https://archive.org/download/holiznacc0-music-archive/HoliznaCC0%20-%20Letting%20Go.mp3"
    },
    {
        title: "Broken",
        artist: "HoliznaCC0",
        url: "https://archive.org/download/holiznacc0-broken/HoliznaCC0%20-%20Broken.mp3"
    },
    {
        title: "Curious",
        artist: "Podington Bear",
        url: "https://archive.org/download/Podington_Bear_-_Curious/Podington_Bear_-_Curious.mp3"
    },
    {
        title: "Surface",
        artist: "Podington Bear",
        url: "https://archive.org/download/Podington_Bear_-_Surface/Podington_Bear_-_Surface.mp3"
    }
  ];

  useEffect(() => {
    // Initialize audio
    const audio = new Audio();
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    // Event Listeners
    audio.onended = () => {
        handleNextTrack();
    };

    audio.oncanplay = () => {
        // Reset failure counter on successful load
        setFailedAttempts(0);
        setErrorMsg(null);
    };

    // Robust Error Handling
    audio.onerror = (e: Event) => {
        const target = e.target as HTMLAudioElement;
        const code = target.error ? target.error.code : 0;
        let message = "Unknown Error";
        
        switch (code) {
            case 1: message = "Aborted"; break;
            case 2: message = "Network Error"; break;
            case 3: message = "Decode Error"; break;
            case 4: message = "Source Not Supported (404)"; break;
        }

        console.error(`Audio Error: ${message} (${code})`);
        
        // Prevent infinite loops if all tracks are bad
        setFailedAttempts(prev => {
            if (prev >= 3) {
                setIsPlaying(false);
                setErrorMsg("Stream Unavailable");
                return 0;
            }
            // Try next track automatically
            console.log("Skipping to next track due to error...");
            const nextIndex = (currentTrackIndex + 1) % playlist.length;
            
            // Need to update state to trigger effect, but careful with loops
            // We use a timeout to prevent rapid firing
            setTimeout(() => {
                 setCurrentTrackIndex(nextIndex);
            }, 1000);
            
            return prev + 1;
        });
    };

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []); // Only run once on mount for setup (track index dep is handled below)

  // Handle track switching
  useEffect(() => {
    if (audioRef.current) {
        // Don't auto-play on first render if not intended
        const shouldPlay = isPlaying;
        
        audioRef.current.src = playlist[currentTrackIndex].url;
        
        if (shouldPlay) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay prevented or interrupted:", error);
                    setIsPlaying(false);
                    if (error.name === 'NotAllowedError') {
                        setErrorMsg("Tap to play");
                    }
                });
            }
        }
    }
  }, [currentTrackIndex]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  // Watch for isPlaying changes to trigger play/pause on existing source
  useEffect(() => {
      if (audioRef.current) {
          if (isPlaying && audioRef.current.paused) {
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                  playPromise.catch(e => {
                      console.error("Play error:", e);
                      setIsPlaying(false);
                  });
              }
          } else if (!isPlaying && !audioRef.current.paused) {
              audioRef.current.pause();
          }
      }
  }, [isPlaying]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(prev => !prev);
    setErrorMsg(null);
    setFailedAttempts(0);
  };

  const handleNextTrack = () => {
      setFailedAttempts(0); // Reset failures on manual skip
      setErrorMsg(null);
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
      setIsPlaying(true);
  };

  if (!isOpen) return null;

  // Compact / Minimized Mode
  if (isMinimized) {
      return (
        <div className="fixed bottom-6 right-6 z-[200] animate-spring-up">
            <div 
                onClick={() => setIsMinimized(false)}
                className="group relative cursor-pointer"
            >
                {/* Spinning Vinyl */}
                <div className={`w-14 h-14 rounded-full bg-[#1c1c1e] border border-white/20 flex items-center justify-center relative overflow-hidden shadow-2xl ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50"></div>
                    <div className={`w-4 h-4 rounded-full ${errorMsg ? 'bg-red-500' : 'bg-purple-500'} border border-white/30 z-10`}></div>
                    <Disc3 size={56} className="absolute text-white/10" />
                </div>
                
                {/* Status Indicator */}
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#141218] ${isPlaying ? 'bg-green-500 animate-pulse' : (errorMsg ? 'bg-red-500' : 'bg-gray-500')}`} />
            </div>
        </div>
      );
  }

  // Expanded Mode
  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-spring-up">
      <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 p-4 pr-10 rounded-[24px] shadow-2xl relative max-w-[320px] group overflow-hidden">
         
         <div className="absolute top-2 right-2 flex items-center gap-1">
             {/* Minimize Button */}
             <button 
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-white/40 hover:text-white bg-transparent hover:bg-white/10 rounded-full transition-all"
                title="Свернуть"
             >
                <ChevronDown size={14} />
             </button>
             {/* Close Button */}
             <button 
                onClick={() => { setIsPlaying(false); setIsOpen(false); }}
                className="p-1.5 text-white/40 hover:text-white bg-transparent hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all"
                title="Закрыть"
             >
                <X size={14} />
             </button>
         </div>

         <div className="flex items-center gap-4">
             {/* Vinyl Animation */}
             <div className="relative shrink-0">
                 <div className={`w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center relative overflow-hidden ${isPlaying ? 'animate-spin-slow' : ''}`}>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50"></div>
                    <div className={`w-4 h-4 rounded-full ${errorMsg ? 'bg-red-500' : 'bg-purple-500'} border border-white/30 z-10`}></div>
                    <Disc3 size={48} className="absolute text-white/5" />
                 </div>
                 {/* Visualizer Dots */}
                 {isPlaying && !errorMsg && (
                     <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                         {[1,2,3].map(i => (
                             <div key={i} className="w-1 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: `${i*0.1}s` }} />
                         ))}
                     </div>
                 )}
             </div>

             <div className="flex flex-col pr-6 min-w-0">
                 {errorMsg ? (
                     <div className="flex items-center gap-2 text-red-400">
                         <AlertCircle size={14} />
                         <span className="text-xs font-bold">{errorMsg}</span>
                     </div>
                 ) : (
                     <>
                        <p className="text-white text-sm font-bold leading-tight mb-1 truncate">
                            {playlist[currentTrackIndex].title}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium leading-tight line-clamp-2">
                            {playlist[currentTrackIndex].artist}
                        </p>
                     </>
                 )}
                 <p className="text-[9px] text-gray-500 mt-1 italic opacity-60">
                    Chill & Focus
                 </p>
             </div>
         </div>

         {/* Controls */}
         <div className="mt-4 flex items-center gap-3">
             <button 
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shrink-0"
             >
                {isPlaying ? <Pause size={14} fill="currentColor"/> : <Play size={14} fill="currentColor" className="ml-0.5" />}
             </button>

             <button 
                onClick={handleNextTrack}
                className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform shrink-0"
                title="Следующий трек"
             >
                <SkipForward size={14} fill="currentColor" />
             </button>

             {/* Volume Slider */}
             <div className="flex-1 flex items-center gap-2 group/vol">
                <Volume2 size={14} className="text-gray-500 shrink-0" />
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
             </div>
         </div>
      </div>
    </div>
  );
};
