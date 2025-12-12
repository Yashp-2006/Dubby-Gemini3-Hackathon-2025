import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import Controls from './components/Controls';
import ResultsTable from './components/ResultsTable';
import LoadingScreen from './components/LoadingScreen';
import { AppState, Language, DubbingResult, GeminiVoice } from './types';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { processVideoInput } from './utils';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<Language>(Language.SPANISH);
  const [voice, setVoice] = useState<GeminiVoice>(GeminiVoice.PUCK);
  const [isLookingDown, setIsLookingDown] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [results, setResults] = useState<DubbingResult[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  
  const isDubbingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500); 
    return () => clearTimeout(timer);
  }, []);

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoObjectUrl(url);
    setAppState(AppState.FILE_SELECTED);
  }, []);

  const handleRemoveMedia = useCallback(() => {
    if (videoObjectUrl) {
      URL.revokeObjectURL(videoObjectUrl);
    }
    setSelectedFile(null);
    setVideoObjectUrl(null);
    setAppState(AppState.IDLE);
    setResults([]);
  }, [videoObjectUrl]);

  const handleVideoUpdate = useCallback((file: File) => {
    if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
    }
    const url = URL.createObjectURL(file);
    setVideoObjectUrl(url);
  }, [videoObjectUrl]);

  const handleDub = useCallback(async () => {
    if (!selectedFile || isDubbingRef.current) return;
    isDubbingRef.current = true;

    setAppState(AppState.ANIMATING_INTO_MOUTH);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setAppState(AppState.PROCESSING_WATCHING);
    
    const minWatchTime = new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let videoPart;
      try {
        videoPart = await processVideoInput(ai, selectedFile, setProcessingStatus);
      } catch (error) {
        throw new Error("Failed to process video: " + (error instanceof Error ? error.message : String(error)));
      }

      await minWatchTime;

      setAppState(AppState.PROCESSING_REWRITING);
      setProcessingStatus("Generating script (this may take a moment)...");
      
      const promptText = `
        You are Dubby, an expert AI video dubbing assistant.
        **TASK: Transcription & Translation**
        1. **Transcribe**: Listen to the ENTIRE audio track. Write down the 'originalText' exactly as spoken.
        2. **Translate & Compress**: Translate to ${targetLanguage}. 
           **CRITICAL**: The 'optimizedText' MUST be concise. It should be speakable in the SAME duration as the original. 
           Prefer shorter synonyms. Remove filler words. 
           The goal is PERFECT LIP SYNC, so match the syllable count and rhythm of the original speech as closely as possible.
        
        For each spoken segment:
        1. 'startTime' & 'endTime': "MM:SS.mmm". Precision is key.
        2. 'originalText': Verbatim.
        3. 'optimizedText': ${targetLanguage} translation (Concise & Rhythmic).
        
        Output MUST be a JSON array containing ALL segments.
      `;

      const contents = {
          parts: [videoPart, { text: promptText }]
      };

      const streamResult = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          responseMimeType: "application/json",
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                originalText: { type: Type.STRING },
                optimizedText: { type: Type.STRING },
              },
              required: ["startTime", "endTime", "originalText", "optimizedText"],
            },
          },
        },
      });

      let fullText = "";
      for await (const chunk of streamResult) {
          const c = chunk as GenerateContentResponse;
          if (c.text) {
              fullText += c.text;
              setProcessingStatus((prev) => 
                  prev.startsWith("Receiving") 
                  ? prev + "." 
                  : "Receiving synchronization data..."
              );
          }
      }

      if (fullText) {
        try {
            const data = JSON.parse(fullText);
            const resultsWithIds = data.map((item: any, idx: number) => ({
                ...item,
                id: idx.toString(),
                reasoning: "Optimized for timing." 
            }));
            setResults(resultsWithIds);
        } catch (parseError) {
             console.error("JSON Parse Error:", parseError);
             throw new Error("Failed to parse AI response. The video might be too long for a single pass.");
        }
      } else {
        throw new Error("No response text from Gemini.");
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setAppState(AppState.COMPLETE);

    } catch (error) {
      console.error("Error generating dubbing script:", error);
      setResults([
        {
          id: 'err1',
          startTime: '00:00.000',
          endTime: '00:05.000',
          originalText: 'Error processing video.',
          optimizedText: 'Error al procesar el video.',
          reasoning: 'Error details: ' + (error instanceof Error ? error.message : String(error))
        }
      ]);
      setAppState(AppState.COMPLETE);
    } finally {
        isDubbingRef.current = false;
    }

  }, [selectedFile, targetLanguage]);

  if (isInitialLoading) {
    return <LoadingScreen text="Waking up Dubby..." subText="Getting ready to speak your language." variant="initial" />;
  }

  const isProcessing = appState === AppState.PROCESSING_WATCHING || appState === AppState.PROCESSING_REWRITING;
  const isResultsView = appState === AppState.COMPLETE;

  return (
    <>
      {isProcessing && (
          <LoadingScreen 
            text={appState === AppState.PROCESSING_WATCHING ? "Dubby is watching..." : "Performing Semantic Compression..."}
            subText={processingStatus}
            variant="processing"
          />
      )}

      {/* Main Container */}
      <div className={`
        bg-sky-50 overflow-x-hidden transition-colors duration-1000 
        ${appState === AppState.ANIMATING_INTO_MOUTH ? 'bg-orange-500' : ''} 
        ${isProcessing ? 'hidden' : 'block'}
        ${isResultsView ? 'min-h-screen' : 'h-screen overflow-hidden flex flex-col justify-center'}
      `}>
        
        {/* Background Gradients/Blobs */}
        <div className={`absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-100 via-white/50 to-transparent pointer-events-none transition-opacity duration-500 ${appState === AppState.ANIMATING_INTO_MOUTH ? 'opacity-0' : 'opacity-100'}`} />
        <div className="fixed -top-10 -right-10 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="fixed top-32 -left-10 w-48 h-48 bg-sky-200 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }}></div>

        {/* 
            Content Wrapper 
            - In IDLE: max-w-5xl, centered vertically
            - In RESULTS: max-w-[1800px], aligned top, wider for split view
        */}
        <div className={`relative z-10 container mx-auto px-4 flex flex-col items-center transition-all duration-500 ${
            isResultsView 
                ? 'max-w-full md:max-w-[95%] lg:max-w-[1800px] justify-start pt-1' 
                : 'max-w-5xl justify-center'
        }`}>
          
          <Header appState={appState} isLookingDown={isLookingDown} />

          <main className={`w-full relative z-20 flex flex-col gap-4 md:gap-8 transition-all duration-700 ${appState === AppState.ANIMATING_INTO_MOUTH ? 'opacity-0 translate-y-20 scale-90' : 'opacity-100'}`}>
            
            {/* Main Stage: Drop Zone */}
            {!isResultsView && (
              <div className="transition-all duration-500 ease-out w-full px-2">
                <DropZone 
                  appState={appState}
                  onFileSelected={handleFileSelected} 
                  onRemoveMedia={handleRemoveMedia}
                  selectedFileName={selectedFile?.name ?? null}
                  setIsLookingDown={setIsLookingDown}
                />
              </div>
            )}

            {/* Controls */}
            {!isResultsView && (
              <div className="px-2">
                <Controls 
                    appState={appState}
                    targetLanguage={targetLanguage}
                    setTargetLanguage={setTargetLanguage}
                    voice={voice}
                    setVoice={setVoice}
                    onDub={handleDub}
                    hasFile={!!selectedFile}
                  />
              </div>
            )}

            {/* Results */}
            {isResultsView && (
              <ResultsTable 
                results={results} 
                videoUrl={videoObjectUrl} 
                targetLanguage={targetLanguage}
                onVideoUpdate={handleVideoUpdate}
                voice={voice}
              />
            )}

          </main>
        </div>
        
        {/* Footer */}
        {!isResultsView ? (
             <div className="absolute bottom-4 left-0 w-full text-center text-sky-900/30 text-xs font-medium">
                <p>&copy; {new Date().getFullYear()} Dubby.</p>
             </div>
        ) : (
             <footer className="mt-4 text-center text-sky-900/40 text-xs font-medium py-6">
                <p>&copy; {new Date().getFullYear()} Dubby.</p>
             </footer>
        )}
      </div>
    </>
  );
};

export default App;