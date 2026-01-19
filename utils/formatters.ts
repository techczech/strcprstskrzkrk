import { TwisterContent, TwisterProgress, TwisterCardView, Difficulty, DifficultyBadgeView } from '../types';

/**
 * Formats difficulty into visual properties (colors, borders)
 */
export const formatDifficulty = (diff: Difficulty): DifficultyBadgeView => {
  let colorClass = 'bg-slate-100 text-slate-700';
  switch (diff) {
    case Difficulty.Easy: 
      colorClass = 'bg-green-100 text-green-700 border-green-200'; 
      break;
    case Difficulty.Medium: 
      colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-200'; 
      break;
    case Difficulty.Hard: 
      colorClass = 'bg-orange-100 text-orange-700 border-orange-200'; 
      break;
    case Difficulty.Insane: 
      colorClass = 'bg-red-100 text-red-700 border-red-200'; 
      break;
  }
  return { label: diff, className: colorClass };
};

/**
 * Formats a timestamp into a human-readable "time ago" string
 */
export const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (mins > 0) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    return 'Just now';
};

/**
 * Transforms raw TwisterContent and runtime Progress into a View Model for the Card component
 */
export const formatTwisterCard = (twister: TwisterContent, progress?: TwisterProgress): TwisterCardView => {
    const hasProgress = !!progress;
    
    return {
        id: twister.id,
        content: twister,
        difficultyBadge: formatDifficulty(twister.difficulty),
        hasProgress,
        progressLabel: progress ? formatTimeAgo(progress.lastPracticed) : undefined,
        completionsLabel: progress ? `${progress.completions} session${progress.completions !== 1 ? 's' : ''}` : undefined,
        buttonText: hasProgress ? 'Practice Again' : 'Start Practice',
        buttonClassName: hasProgress 
            ? 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white' 
            : 'bg-slate-900 text-white hover:bg-indigo-600',
        iconType: hasProgress ? 'check' : 'volume',
        statusColorClass: hasProgress 
            ? 'bg-green-100 text-green-600' 
            : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
    };
};
