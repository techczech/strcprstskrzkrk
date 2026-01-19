import { GoogleGenAI, Modality } from "@google/genai";

// Safe access to process.env for browser environments where it might not be polyfilled
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_KEY || '';
  }
  return '';
};

const API_KEY = getApiKey();
const CACHE_PREFIX = 'tts_cache_';

// Helper to decode Base64 to ArrayBuffer
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode raw audio data to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit PCM to float [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const generateSpeech = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const cacheKey = CACHE_PREFIX + text;

  // 1. Try to load from LocalStorage cache (simulating pre-recorded assets)
  const cachedBase64 = localStorage.getItem(cacheKey);
  if (cachedBase64) {
    try {
      return await decodeAudioData(decode(cachedBase64), audioContext);
    } catch (e) {
      console.warn("Cached audio corrupted, refreshing...");
      localStorage.removeItem(cacheKey);
    }
  }

  // 2. Fetch from API if not cached
  if (!API_KEY) {
      // Fail gracefully if no API key is present (allows app to run without audio)
      throw new Error("API Key missing");
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    // 3. Cache the result
    try {
      localStorage.setItem(cacheKey, base64Audio);
    } catch (e) {
      console.warn("LocalStorage quota exceeded, could not cache audio.");
    }

    return await decodeAudioData(decode(base64Audio), audioContext);
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};