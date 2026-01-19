import { TwisterProgress } from '../types';

const STORAGE_KEY = 'czech-twisters-progress';

export const getProgress = (): Record<string, TwisterProgress> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveProgress = (id: string): Record<string, TwisterProgress> => {
  const current = getProgress();
  const now = Date.now();
  
  current[id] = {
    id,
    lastPracticed: now,
    completions: (current[id]?.completions || 0) + 1
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
};