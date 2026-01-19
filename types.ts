export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
  Insane = 'Insane'
}

// --- Content Schema (JSON Data Structure) ---

export interface TwisterContent {
  id: string;
  text: string;
  translation: string;
  meaning: string;
  difficulty: Difficulty;
  // Practice specific content
  ipa?: string;
  breakdown?: string[];
  tips?: string;
  audioSrc?: string;
}

export interface SoundGuideContent {
  sound: string;
  ipa: string;
  description: string;
  example: string;
}

// --- Runtime Data ---

export interface TwisterProgress {
  id: string;
  lastPracticed: number;
  completions: number;
}

// --- View Models (Presentation Layer) ---

export interface DifficultyBadgeView {
  label: string;
  className: string;
}

export interface TwisterCardView {
  id: string;
  content: TwisterContent; // Reference to raw content if needed
  
  // UI Properties
  difficultyBadge: DifficultyBadgeView;
  hasProgress: boolean;
  
  // Formatted Strings
  progressLabel?: string;
  completionsLabel?: string;
  
  // Button State
  buttonText: string;
  buttonClassName: string;
  
  // Visual State
  iconType: 'check' | 'volume';
  statusColorClass: string;
}

export interface PracticeSessionView {
  twister: TwisterContent;
  ipa: string;
  breakdown: string[];
  tips: string;
}

export interface PracticeStep {
  text: string;
  ipa?: string;
  audioBuffer?: AudioBuffer | null;
}