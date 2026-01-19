import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_TWISTERS, DIFFICULT_SOUNDS } from './constants';
import { TwisterContent, TwisterProgress } from './types';
import PracticeMode from './components/PracticeMode';
import { getProgress } from './services/storageService';
import { formatTwisterCard } from './utils/formatters';
import { Play, Pause, Sparkles, BookOpen, Volume2, ArrowRight, Lightbulb, Ear, MessageCircle, CheckCircle, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [selectedTwister, setSelectedTwister] = useState<TwisterContent | null>(null);
  const [progressData, setProgressData] = useState<Record<string, TwisterProgress>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Pronunciation Guide State
  const [guideIndex, setGuideIndex] = useState(0);

  const loadProgressData = () => {
    setProgressData(getProgress());
  };

  useEffect(() => {
    loadProgressData();
    
    // Cleanup audio on unmount
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };
  }, []);

  const handleNextGuide = () => {
    setGuideIndex((prev) => (prev + 1) % INITIAL_TWISTERS.length);
  };

  const handlePracticeClose = () => {
    setSelectedTwister(null);
    loadProgressData(); // Refresh progress after session
  };
  
  const handlePlayAudio = (e: React.MouseEvent, twister: TwisterContent) => {
    e.stopPropagation();
    
    // If clicking the same one, toggle pause/stop
    if (playingId === twister.id) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
    }

    // Stop currently playing
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    // Play new one
    if (twister.audioSrc) {
        const audio = new Audio(twister.audioSrc);
        audioRef.current = audio;
        setPlayingId(twister.id);
        
        audio.play().catch(err => {
            console.error("Playback failed:", err);
            setPlayingId(null);
            alert(`Could not play audio: ${twister.audioSrc}`);
        });
        
        audio.onended = () => {
            setPlayingId(null);
        };
        
        audio.onerror = () => {
            console.error("Audio load error for", twister.audioSrc);
            setPlayingId(null);
        };
    }
  };

  const currentGuideTwister = INITIAL_TWISTERS[guideIndex];
  
  // View Model for the Guide Section (simple inline construction as it's singular)
  const guideView = {
    text: currentGuideTwister.text,
    ipa: currentGuideTwister.ipa || '',
    breakdown: currentGuideTwister.breakdown || [],
    tips: currentGuideTwister.tips || '',
    index: guideIndex + 1
  };

  const titleTwister = INITIAL_TWISTERS[0];
  const isTitlePlaying = playingId === titleTwister.id;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-200 selection:text-indigo-900">
      
      {/* Hero Section */}
      <header className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-blue-100 rounded-full blur-3xl opacity-50 w-64 h-64"></div>
        <div className="absolute bottom-0 left-0 p-12 -ml-12 -mb-12 bg-red-100 rounded-full blur-3xl opacity-50 w-64 h-64"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium mb-6 animate-fade-in-up">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Learn Czech Tongue Twisters</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6">
                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Strč prst <span className="text-indigo-600">skrz krk</span>
                </h1>
                <button
                    onClick={(e) => handlePlayAudio(e, titleTwister)}
                    className={`shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isTitlePlaying
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                        : 'bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 hover:scale-105 shadow-sm'
                    }`}
                    aria-label={isTitlePlaying ? "Stop audio" : "Play title pronunciation"}
                >
                    {isTitlePlaying ? (
                        <Pause className="w-5 h-5 md:w-8 md:h-8 fill-current" />
                    ) : (
                        <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
                    )}
                </button>
            </div>

            <p className="max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed mb-10">
                Explore the weird and wonderful world of Czech tongue twisters. 
                Record your attempts, track your progress, and master the impossible consonants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="#list" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2">
                    <Play className="w-5 h-5 fill-current" />
                    Start Practicing
                </a>
                <div className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-sm">
                   <BookOpen className="w-5 h-5" />
                   {INITIAL_TWISTERS.length} Challenges
                </div>
            </div>
            <p className="mt-8 text-slate-400 text-sm font-medium">
                Conceived and designed by Dominik Lukeš
            </p>
        </div>
      </header>

      {/* Main List */}
      <main id="list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-slate-900 font-fredoka">Popular Twisters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {INITIAL_TWISTERS.map((twister) => {
                // Use Formatter to create View Model
                const view = formatTwisterCard(twister, progressData[twister.id]);
                const isPlaying = playingId === twister.id;
                
                return (
                    <div 
                        key={view.id} 
                        className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col relative overflow-hidden"
                    >
                        {view.hasProgress && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                        )}
                        
                        <div className="flex justify-between items-start mb-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${view.difficultyBadge.className}`}>
                                {view.difficultyBadge.label}
                            </span>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${view.statusColorClass}`}>
                                {view.iconType === 'check' ? <CheckCircle className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-800 mb-3 min-h-[4rem] leading-snug">
                            {view.content.text}
                        </h3>
                        
                        <div className="flex-1">
                            <p className="text-slate-500 italic mb-2 text-sm border-l-2 border-indigo-100 pl-3">
                                "{view.content.translation}"
                            </p>
                            <p className="text-slate-400 text-xs line-clamp-2">
                                {view.content.meaning}
                            </p>
                        </div>

                        {view.hasProgress && (
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-medium text-slate-600">
                                    <Clock className="w-3 h-3" /> 
                                    {view.progressLabel}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>
                                    {view.completionsLabel}
                                </span>
                            </div>
                        )}

                        <div className="mt-6 flex items-center gap-3">
                            {/* Prominent Playback Button */}
                            <button
                                onClick={(e) => handlePlayAudio(e, view.content)}
                                className={`relative shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                                    isPlaying 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105'
                                }`}
                                aria-label={isPlaying ? "Stop audio" : "Play audio"}
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 fill-current" />
                                ) : (
                                    <Play className="w-6 h-6 fill-current ml-1" />
                                )}
                                {isPlaying && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></span>
                                )}
                            </button>

                            {/* Practice Action */}
                            <button
                                onClick={() => setSelectedTwister(view.content)}
                                className={`flex-1 h-14 px-4 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 ${view.buttonClassName}`}
                            >
                                {view.hasProgress ? 'Practice' : 'Start'}
                                {!view.hasProgress && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
      </main>

      {/* Difficult Sounds Table */}
      <section className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold font-fredoka text-slate-900">Difficult Czech Sounds</h2>
                <p className="text-slate-500 mt-2">Master these unique phonemes to improve your fluency.</p>
            </div>
            
            <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-500 text-sm uppercase tracking-wider border-b border-slate-200">
                                <th className="p-6 font-semibold">Sound</th>
                                <th className="p-6 font-semibold">IPA</th>
                                <th className="p-6 font-semibold w-1/2">Description</th>
                                <th className="p-6 font-semibold">Example</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {DIFFICULT_SOUNDS.map((item, idx) => (
                                <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                                    <td className="p-6 font-bold text-slate-900 text-lg">{item.sound}</td>
                                    <td className="p-6 font-mono text-indigo-600 bg-slate-50/50">{item.ipa}</td>
                                    <td className="p-6 text-slate-600">{item.description}</td>
                                    <td className="p-6 text-slate-800 italic">{item.example}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </section>

      {/* Pronunciation Guide Section */}
      <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500 rounded-full blur-[80px]"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold font-fredoka mb-4">Pronunciation Guide</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Deep dive into the phonetics. Learn step-by-step with our breakdown guides.
                </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 transition-all">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-1 w-full">
                            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30 mb-4">
                                Twister #{guideView.index}
                            </span>
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                {guideView.text}
                            </h3>
                            <div className="flex items-center gap-3 mb-6 bg-black/20 p-4 rounded-xl w-fit">
                                <Ear className="w-5 h-5 text-indigo-400" />
                                <code className="font-mono text-lg text-indigo-200">{guideView.ipa}</code>
                            </div>

                            {/* Step-by-step Preview */}
                            <div className="mb-8">
                                <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" /> Word Breakdown
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {guideView.breakdown.map((step, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors">
                                            {step}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            </div>
                    </div>

                    <div className="bg-indigo-900/40 rounded-2xl p-6 border border-white/5 mb-8">
                            <div className="flex items-start gap-4">
                            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400 shrink-0">
                                <Lightbulb className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg mb-2">Pro Tip</h4>
                                <p className="text-slate-300 leading-relaxed">
                                    {guideView.tips}
                                </p>
                            </div>
                            </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={handleNextGuide}
                            className="group flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                        >
                            Reveal Next Twister
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-900 font-medium mb-2">Conceived and designed by Dominik Lukeš</p>
            <p className="text-slate-500 mb-2">Designed for Czech language learners and enthusiasts.</p>
            <p className="text-slate-400 text-sm">Powered by Google Gemini 2.5 • Built with React & Tailwind</p>
        </div>
      </footer>

      {/* Practice Modal */}
      {selectedTwister && (
        <PracticeMode 
            twister={selectedTwister} 
            onClose={handlePracticeClose} 
        />
      )}
    </div>
  );
};

export default App;