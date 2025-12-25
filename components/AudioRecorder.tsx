
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Loader2, Sparkles, AlertCircle, List, FileText, RefreshCw, X, RotateCcw, RotateCw, Upload } from 'lucide-react';
import { Button } from './Button';
import { transcribeAudio } from '../services/geminiService';
import { AudioAnalysisResult } from '../types';

interface AudioRecorderProps {
  onOpenMenu: () => void;
  onExit?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onOpenMenu, onExit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AudioAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ru-RU';

        recognition.onresult = (event: any) => {
            let final = '';
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            if (final) setLiveTranscript(prev => prev + ' ' + final);
            setInterimTranscript(interim);
        };
        recognitionRef.current = recognition;
    }
    
    return () => {
        stopVisualizer();
        if (timerRef.current) clearInterval(timerRef.current);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current = null;
        }
    };
  }, []);

  const startVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256; // Larger FFT for smoother wave
    analyser.smoothingTimeConstant = 0.85; // Smoother transitions
    
    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        
        // Clear with fade effect for trail
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Not used, we clear completely for transparent look
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#a855f7'; // Purple
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const sliceWidth = width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2; // Scale height

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                // Bezier curve for smoothness
                const prevX = x - sliceWidth;
                const prevY = (dataArray[i-1] / 128.0) * height / 2;
                const cp1x = prevX + sliceWidth / 2;
                const cp1y = prevY;
                const cp2x = prevX + sliceWidth / 2;
                const cp2y = y;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        
        // Create Gradient Stroke
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "rgba(168, 85, 247, 0)");
        gradient.addColorStop(0.5, "rgba(168, 85, 247, 1)");
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)");
        ctx.strokeStyle = gradient;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(168, 85, 247, 0.6)";
        
        ctx.stroke();
    };
    
    draw();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const streamDuration = Date.now() - startTimeRef.current;
        
        // --- LOGIC: DISCARD < 1 SECOND ---
        if (streamDuration < 1000) {
            stream.getTracks().forEach(track => track.stop());
            stopVisualizer();
            recognitionRef.current?.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Reset everything silently
            setAudioBlob(null);
            setDuration(0);
            setLiveTranscript("");
            setInterimTranscript("");
            return;
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        stopVisualizer();
        recognitionRef.current?.stop();
      };

      mediaRecorder.start();
      recognitionRef.current?.start();
      startVisualizer(stream);
      
      setIsRecording(true);
      setDuration(0);
      setResult(null);
      setError(null);
      setAudioBlob(null);
      setLiveTranscript("");
      setInterimTranscript("");
      setPlaybackProgress(0);
      setIsPlaying(false);

      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone", err);
      setError("Не удалось получить доступ к микрофону.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
          setError("Файл слишком большой (макс. 50МБ)");
          return;
      }

      const blob = new Blob([file], { type: file.type });
      setAudioBlob(blob);
      setDuration(0); 
      setResult(null);
      setError(null);
      setLiveTranscript("");
      setInterimTranscript("");
      setIsPlaying(false);
      setPlaybackProgress(0);
      e.target.value = '';
  };

  const initAudioPlayer = () => {
      if (!audioBlob) return null;
      if (!audioPlayerRef.current) {
          const url = URL.createObjectURL(audioBlob);
          const audio = new Audio(url);
          audio.playbackRate = playbackSpeed;
          audio.onloadedmetadata = () => {
              if (duration === 0) setDuration(audio.duration);
          };
          audio.ontimeupdate = () => {
              setPlaybackProgress((audio.currentTime / audio.duration) * 100);
          };
          audio.onended = () => {
              setIsPlaying(false);
              setPlaybackProgress(100);
          };
          audioPlayerRef.current = audio;
      }
      return audioPlayerRef.current;
  };

  const togglePlayback = () => {
    const audio = initAudioPlayer();
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      if (playbackProgress >= 100) {
          audio.currentTime = 0;
      }
    }
  };

  const seek = (seconds: number) => {
      const audio = initAudioPlayer();
      if (audio) {
          audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration);
      }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = initAudioPlayer();
      if (audio) {
          const val = parseFloat(e.target.value);
          const time = (val / 100) * audio.duration;
          audio.currentTime = time;
          setPlaybackProgress(val);
      }
  };
  
  const toggleSpeed = () => {
      const newSpeed = playbackSpeed === 1 ? 1.5 : (playbackSpeed === 1.5 ? 2 : 1);
      setPlaybackSpeed(newSpeed);
      if (audioPlayerRef.current) {
          audioPlayerRef.current.playbackRate = newSpeed;
      }
  };

  const processAudio = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    setError(null);
    if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          const analysis = await transcribeAudio(base64Audio, audioBlob.type);
          setResult(analysis);
        } catch (err: any) {
          setError(err.message || "Ошибка обработки аудио");
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (err) {
      setIsProcessing(false);
      setError("Ошибка подготовки файла");
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetAll = () => {
      setAudioBlob(null); 
      setResult(null); 
      setLiveTranscript("");
      if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          audioPlayerRef.current = null;
      }
      setIsPlaying(false);
      setPlaybackProgress(0);
      setDuration(0);
      setPlaybackSpeed(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fdf7ff] dark:bg-[#141218] flex flex-col animate-pop-in overflow-hidden">
      
      <input type="file" ref={fileInputRef} accept="audio/*" onChange={handleFileUpload} className="hidden" />

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-900/10 rounded-full blur-[120px] transition-all duration-1000 ${isRecording ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
          <div />
          <div className={`px-4 py-1 rounded-full text-sm font-mono font-medium transition-all duration-300 ${isRecording ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400'}`}>
             {formatTime(duration)}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 px-6 pt-24 pb-40 overflow-y-auto scrollbar-hide">
         
         {!result && (
             <div className="flex-1 flex flex-col justify-center items-center text-center">
                 {/* Smoother Waveform Visualizer */}
                 <div className={`relative w-full h-32 mb-8 transition-all duration-500 ${isRecording ? 'opacity-100 scale-100' : 'opacity-0 scale-90 h-0 overflow-hidden'}`}>
                     {/* Soft Masking Container */}
                    <div className="absolute inset-0 mask-image-linear-gradient">
                        <canvas ref={canvasRef} width={window.innerWidth} height={128} className="w-full h-full" />
                    </div>
                 </div>

                 {!isRecording && !audioBlob && (
                    <div className="animate-spring-up">
                        <h2 className="text-3xl font-bold text-black dark:text-white mb-2 tracking-tight">Начните запись</h2>
                        <p className="text-gray-500 dark:text-gray-400">Нажмите на сферу или загрузите файл</p>
                    </div>
                 )}

                 {!isRecording && audioBlob && (
                     <div className="w-full max-w-sm mx-auto bg-white/80 dark:bg-[#2b2930]/80 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl animate-spring-up border border-white/20">
                         {/* Static waveform placeholder */}
                         <div className="flex items-center justify-center gap-1 h-12 mb-6 opacity-30">
                             {[...Array(20)].map((_, i) => (
                                 <div key={i} className="w-1.5 bg-black dark:bg-white rounded-full transition-all duration-500" style={{ height: `${20 + Math.random() * 80}%` }}></div>
                             ))}
                         </div>
                         
                         <div className="flex items-center justify-between gap-4 mb-6">
                            <span className="text-xs font-mono text-gray-500 w-10">
                                {audioPlayerRef.current ? formatTime(audioPlayerRef.current.currentTime) : "0:00"}
                            </span>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={playbackProgress} 
                                onChange={handleSliderChange}
                                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <span className="text-xs font-mono text-gray-500 w-10 text-right">
                                {formatTime(duration)}
                            </span>
                         </div>

                         <div className="flex items-center justify-center gap-6 mb-8">
                            <button onClick={() => seek(-10)} className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors"><RotateCcw size={20} /></button>
                            <button onClick={togglePlayback} className="w-16 h-16 rounded-[24px] flex items-center justify-center bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                            </button>
                            <button onClick={() => seek(10)} className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors"><RotateCw size={20} /></button>
                         </div>
                         
                         <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 pt-4">
                            <button onClick={toggleSpeed} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">{playbackSpeed}x</button>
                            <div className="flex gap-2">
                                <button onClick={resetAll} className="p-3 rounded-full bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-100 transition-colors"><X size={20} /></button>
                                <button onClick={processAudio} className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2">
                                    <Sparkles size={18} /><span>Текст</span>
                                </button>
                            </div>
                         </div>
                     </div>
                 )}
                 
                 <div className={`mt-8 text-lg leading-relaxed max-w-lg mx-auto text-gray-700 dark:text-gray-300 transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
                     {liveTranscript}
                     <span className="text-gray-400 italic">{interimTranscript}</span>
                 </div>
             </div>
         )}

         {/* Results View - Same as before */}
         {result && (
             <div className="max-w-2xl mx-auto w-full animate-slide-up-fade">
                <div className="ios-glass p-6 rounded-[32px] mb-6 animate-spring-up delay-100">
                    <h3 className="flex items-center gap-2 text-purple-600 dark:text-purple-300 font-bold mb-3 uppercase text-xs tracking-wider">
                        <Sparkles size={14} /> Саммари
                    </h3>
                    <div className="text-lg font-medium text-black dark:text-white leading-relaxed">
                        {result.summary}
                    </div>
                </div>
                <div className="bg-white/50 dark:bg-white/5 rounded-[32px] p-6 mb-6 animate-spring-up delay-200">
                    <h3 className="flex items-center gap-2 text-blue-600 dark:text-blue-300 font-bold mb-4 uppercase text-xs tracking-wider">
                        <List size={14} /> Ключевые моменты
                    </h3>
                    <ul className="space-y-4">
                        {result.keyPoints.map((point, i) => (
                            <li key={i} className="flex gap-4 text-gray-700 dark:text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
                                <span className="leading-relaxed">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-6 animate-spring-up delay-300">
                    <h3 className="flex items-center gap-2 text-gray-500 font-bold mb-4 uppercase text-xs tracking-wider">
                        <FileText size={14} /> Полная расшифровка
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-loose whitespace-pre-wrap text-base font-mono">
                        {result.transcription}
                    </p>
                </div>
             </div>
         )}
         
         {isProcessing && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                 <div className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl flex flex-col items-center">
                    <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
                    <span className="text-black dark:text-white font-bold">Анализ Gemini...</span>
                 </div>
             </div>
         )}
      </div>

      {/* Bottom Controls */}
      {!audioBlob && !result && (
        <div className="fixed bottom-0 left-0 right-0 p-10 flex flex-col items-center justify-center z-40 bg-gradient-to-t from-[#fdf7ff] via-[#fdf7ff]/90 dark:from-[#141218] dark:via-[#141218]/90 to-transparent pb-16 pointer-events-none">
            
            <div className="relative group pointer-events-auto">
                <div className={`absolute inset-0 rounded-full blur-xl bg-purple-500/50 transition-all duration-500 ${isRecording ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`} />
                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`
                        relative w-24 h-24 flex items-center justify-center transition-all duration-500 z-10
                        ${isRecording ? 'liquid-orb scale-110 shadow-[0_0_40px_rgba(168,85,247,0.6)]' : 'bg-black dark:bg-white rounded-full scale-100 shadow-xl hover:scale-105 active:scale-95'}
                    `}
                >
                    {isRecording ? <Square size={32} className="text-white drop-shadow-md" fill="currentColor" /> : <Mic size={36} className="text-white dark:text-black" />}
                </button>
            </div>
            
            {!isRecording ? (
                <div className="mt-8 flex items-center gap-4 animate-slide-up-fade pointer-events-auto">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-white/20 transition-all text-sm font-medium text-gray-600 dark:text-gray-300">
                        <Upload size={16} /> Загрузить файл
                    </button>
                </div>
            ) : (
                <p className="mt-6 text-xs text-gray-400">Удерживайте для паузы...</p>
            )}
        </div>
      )}

      {result && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-spring-up">
               <Button onClick={resetAll} className="bg-black dark:bg-white text-white dark:text-black shadow-2xl !px-8 !py-4 !rounded-full">
                   <RefreshCw size={20} /><span>Новая запись</span>
               </Button>
          </div>
      )}

      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-6 py-3 rounded-full flex items-center gap-2 shadow-lg z-50 animate-pop-in border border-red-200 dark:border-red-800">
            <AlertCircle size={18} /> {error}
        </div>
      )}
    </div>
  );
};
