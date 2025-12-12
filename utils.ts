import { GoogleGenAI } from "@google/genai";

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'video/mp4', // Default fallback
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processVideoInput = async (
  ai: GoogleGenAI, 
  file: File, 
  onStatusUpdate?: (status: string) => void
): Promise<any> => {
  // 20MB limit for inline base64 to avoid browser memory crashes and payload limits
  const INLINE_LIMIT = 20 * 1024 * 1024; 

  if (file.size < INLINE_LIMIT) {
    if (onStatusUpdate) onStatusUpdate("Analyzing local video file...");
    return fileToGenerativePart(file);
  }

  if (onStatusUpdate) onStatusUpdate("Uploading large video to Gemini...");
  console.log("Uploading large file to Gemini...");
  
  try {
      const uploadResult = await ai.files.upload({
        file: file,
        config: { 
          displayName: file.name,
          mimeType: file.type || 'video/mp4' // Default fallback to prevent API error
        }
      });

      // Handle potential response structure (sometimes wrapped in .file, sometimes not)
      // @ts-ignore
      let fileData = uploadResult.file || uploadResult;
      
      if (!fileData || !fileData.name) {
         throw new Error("Upload response missing file metadata.");
      }

      console.log(`File uploaded: ${fileData.uri}. State: ${fileData.state}`);
      if (onStatusUpdate) onStatusUpdate("Video uploaded. Waiting for processing...");
      
      // Wait for processing to complete
      while (fileData.state === 'PROCESSING') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const getResult = await ai.files.get({ name: fileData.name });
        
        // Robustly get the file object
        // @ts-ignore
        const updatedFile = getResult.file || getResult;
        
        if (!updatedFile) {
            throw new Error("Failed to retrieve updated file status.");
        }
        
        fileData = updatedFile;
        console.log(`Processing status: ${fileData.state}`);
        if (onStatusUpdate) onStatusUpdate(`Processing video on Gemini servers...`);
      }

      if (fileData.state === 'FAILED') {
        throw new Error("Video processing failed on Gemini servers.");
      }

      console.log("File ready for inference:", fileData.uri);
      if (onStatusUpdate) onStatusUpdate("Video processed. Generating insights...");

      return {
        fileData: {
          fileUri: fileData.uri,
          mimeType: fileData.mimeType
        }
      };
  } catch (e: any) {
      console.error("processVideoInput error:", e);
      throw e;
  }
};

export const parseTimestamp = (timeStr: string): number => {
  // Handles formats like "00:00:01", "00:01.500", "1:05", etc.
  if (!timeStr) return 0;
  
  // Clean string
  const cleanTime = timeStr.trim();
  const parts = cleanTime.split(':');
  
  let seconds = 0;
  
  if (parts.length === 3) {
    // HH:MM:SS
    seconds += parseFloat(parts[0]) * 3600;
    seconds += parseFloat(parts[1]) * 60;
    seconds += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS
    seconds += parseFloat(parts[0]) * 60;
    seconds += parseFloat(parts[1]);
  } else {
    // SS
    seconds = parseFloat(cleanTime);
  }
  
  return isNaN(seconds) ? 0 : seconds;
};

// --- Audio Decoding Utils for Gemini API ---

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  // CRITICAL FIX: Create a copy of the buffer to ensure byte alignment.
  // Directly viewing the buffer of a Uint8Array that might be a slice or have an offset
  // can cause issues when creating an Int16Array.
  const alignedBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const dataInt16 = new Int16Array(alignedBuffer);
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize to [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}