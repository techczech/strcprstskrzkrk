export const loadAudio = async (url: string, context: AudioContext): Promise<AudioBuffer> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error("Failed to load audio file:", url, error);
    throw error;
  }
};