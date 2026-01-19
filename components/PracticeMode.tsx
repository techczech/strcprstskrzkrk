import React, { useState, useEffect, useRef } from 'react';
import { TwisterContent, PracticeSessionView } from '../types';
import { loadAudio } from '../services/audioService';
import { generateSpeech } from '../services/geminiService';
import { saveProgress } from '../services/storageService';
import AudioPlayer from './AudioPlayer';
import { Mic, X, ChevronRight, CheckCircle, RotateCcw, Award, Square, VolumeX, Loader2 } from 'lucide-react';

interface PracticeModeProps {
  twister: TwisterContent;
  onClose: () => void;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ twister, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PracticeSessionView | null>(null);
  const [step, setStep] = useState(0); // 0: Overview, 1...N: Breakdown, N+1: Full Practice
  const [audioBuffers, setAudioBuffers] = useState<Record<string, AudioBuffer>>({});
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [userAudioBuffer, setUserAudioBuffer] = useState<AudioBuffer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isPressingRef = useRef<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        
        // Use pre-computed data from constants mapped to the View Model
        const details: PracticeSessionView = {
            twister,
            ipa: twister.ipa || '',
            breakdown: twister.breakdown || [],
            tips: twister.tips || ''
        };
        
        setData(details);

        // Load audio assets
        const buffers: Record<string, AudioBuffer> = {};

        // Fetch audio for the main phrase if available
        if (twister.audioSrc) {
            try {
                // Ensure context is ready
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }
                const buff = await loadAudio(twister.audioSrc, ctx);
                buffers[twister.text] = buff;
            } catch (e) {
                console.warn("Failed to load audio for", twister.text, e);
            }
        }

        setAudioBuffers(buffers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();

    return () => {
        // We generally keep context alive during the session, but close on unmount
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };
  }, [twister]);

  const handlePlay = (key: string) => {
    setPlayingKey(key);
  };

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    if (isRecording || isPressingRef.current) return;
    
    isPressingRef.current = true;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!isPressingRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        try {
            const arrayBuffer = await blob.arrayBuffer();
             if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                 audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            
            // Decode can only happen on non-closed context
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
            setUserAudioBuffer(decodedBuffer);
        } catch (e) {
            console.error("Failed to decode user audio", e);
        } finally {
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setUserAudioBuffer(null);
    } catch (err) {
      console.error("Mic error", err);
      alert("Microphone access is needed to practice.");
      isPressingRef.current = false;
      setIsRecording(false);
    }
  };

  const stopRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    isPressingRef.current = false;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFinish = () => {
    saveProgress(twister.id);
    onClose();
  };

  // Helper to get safe values
  const steps = data ? [...data.breakdown] : [];
  const isFinalStep = step === steps.length;
  const currentText = data ? (isFinalStep ? twister.text : steps[step]) : '';
  
  // TTS Generation Effect
  useEffect(() => {
    const checkAndGenerateAudio = async () => {
        if (!currentText || loading) return;
        if (audioBuffers[currentText]) return; // Already have it

        // Special case: If we are on final step and audioSrc was provided, we likely failed to load it in init 
        // OR we can generate it as fallback. 
        // Logic: Try to generate if missing.
        
        setIsGenerating(true);
        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                 audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const buffer = await generateSpeech(currentText, ctx);
            setAudioBuffers(prev => ({ ...prev, [currentText]: buffer }));
        } catch (e) {
            console.error("Failed to generate TTS", e);
        } finally {
            setIsGenerating(false);
        }
    };

    checkAndGenerateAudio();
  }, [currentText, loading, audioBuffers]);


  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl flex flex-col items-center animate-bounce-subtle">
           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-slate-600 font-medium">Loading practice session...</p>
        </div>
      </div>
    );
  }

  // Determine if we have audio to play
  const hasAudio = !!audioBuffers[currentText]; 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-500 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-fredoka">Practice Mode</h2>
            <p className="opacity-90 text-sm">Step {step + 1} of {steps.length + 1}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center text-center">
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
            <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / (steps.length + 1)) * 100}%` }}
            />
          </div>

          <span className="text-sm font-semibold tracking-wider text-indigo-600 mb-2 uppercase">
            {isFinalStep ? "Final Challenge" : "Back-chaining Step"}
          </span>
          
          <h3 className="text-3xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
            {currentText}
          </h3>

          {/* Tips Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left w-full max-w-lg">
             <div className="flex items-start gap-3">
                <div className="mt-1 bg-amber-200 p-1 rounded-full text-amber-800">
                    <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 text-sm mb-1">Tip</h4>
                    <p className="text-amber-800 text-sm">{data.tips}</p>
                </div>
             </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col items-center gap-8 w-full">
            
            {/* Reference Audio - Dynamic now */}
            {isGenerating ? (
               <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl w-full justify-center border border-slate-100 text-indigo-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Generating audio...</span>
               </div>
            ) : hasAudio ? (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl w-full justify-center border border-slate-100">
                <span className="text-slate-500 font-medium mr-2">Listen to Pronunciation:</span>
                <AudioPlayer 
                  audioBuffer={audioBuffers[currentText]} 
                  isPlaying={playingKey === 'reference'}
                  onPlay={() => handlePlay('reference')}
                  onStop={() => setPlayingKey(null)}
                />
              </div>
            ) : (
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full text-slate-400 text-sm">
                   <VolumeX className="w-4 h-4" />
                   <span>Audio not available</span>
               </div>
            )}

            {/* Recording Area */}
            <div className="w-full">
                {!userAudioBuffer ? (
                     <div className="flex flex-col items-center gap-4 py-6 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-300 transition-colors">
                        <p className="text-slate-500 font-medium">Record your attempt</p>
                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            className={`group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 select-none ${
                                isRecording 
                                ? 'bg-red-500 scale-110 shadow-red-200 shadow-xl' 
                                : 'bg-slate-800 hover:bg-indigo-600 shadow-lg'
                            }`}
                            style={{ touchAction: 'none' }}
                        >
                            {isRecording ? (
                                <Square className="w-8 h-8 text-white fill-current animate-pulse" />
                            ) : (
                                <Mic className="w-8 h-8 text-white" />
                            )}
                        </button>
                        <p className="text-xs text-slate-400">Hold to record, release to stop</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                         <h4 className="font-bold text-slate-800 mb-4">Your Recording</h4>
                         
                         <div className="flex items-center justify-center gap-6 mb-6">
                             {/* User Playback */}
                             <div className="flex flex-col items-center gap-2">
                                <AudioPlayer 
                                    audioBuffer={userAudioBuffer}
                                    isPlaying={playingKey === 'user'}
                                    onPlay={() => handlePlay('user')}
                                    onStop={() => setPlayingKey(null)}
                                />
                                <span className="text-xs text-slate-500 font-medium">You</span>
                             </div>

                             {hasAudio && (
                                <>
                                    <div className="w-px h-12 bg-slate-200"></div>

                                    {/* Reference Playback (Repeated for easy comparison) */}
                                    <div className="flex flex-col items-center gap-2">
                                        <AudioPlayer 
                                            audioBuffer={audioBuffers[currentText]} 
                                            isPlaying={playingKey === 'reference-compare'}
                                            onPlay={() => handlePlay('reference-compare')}
                                            onStop={() => setPlayingKey(null)}
                                        />
                                        <span className="text-xs text-indigo-500 font-medium">Correct</span>
                                    </div>
                                </>
                             )}
                         </div>

                         <div className="flex justify-center">
                            <button 
                                onClick={() => setUserAudioBuffer(null)}
                                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-4 py-2 rounded-full hover:bg-slate-100"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Try Again
                            </button>
                         </div>
                    </div>
                )}
            </div>

          </div>

        </div>

        {/* Footer Nav */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between shrink-0">
            <button
                onClick={() => {
                    setStep(Math.max(0, step - 1));
                    setUserAudioBuffer(null);
                }}
                disabled={step === 0}
                className="px-6 py-3 rounded-xl font-medium text-slate-500 disabled:opacity-30 hover:bg-slate-200 transition-colors"
            >
                Previous
            </button>
            
            {step < steps.length ? (
                <button
                    onClick={() => {
                        setStep(step + 1);
                        setUserAudioBuffer(null);
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center gap-2"
                >
                    Next Step <ChevronRight className="w-4 h-4" />
                </button>
            ) : (
                 <button
                    onClick={handleFinish}
                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium shadow-lg shadow-green-200 hover:bg-green-600 hover:shadow-xl transition-all flex items-center gap-2"
                >
                    Save & Finish <Award className="w-4 h-4" />
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default PracticeMode;