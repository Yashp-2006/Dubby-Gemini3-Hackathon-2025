export interface DubbingResult {
  id: string;
  startTime: string;
  endTime: string;
  originalText: string;
  optimizedText: string;
  reasoning?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  FILE_SELECTED = 'FILE_SELECTED',
  ANIMATING_INTO_MOUTH = 'ANIMATING_INTO_MOUTH',
  PROCESSING_WATCHING = 'PROCESSING_WATCHING',
  PROCESSING_REWRITING = 'PROCESSING_REWRITING',
  COMPLETE = 'COMPLETE'
}

export enum Language {
  SPANISH = 'Spanish',
  HINDI = 'Hindi',
  GERMAN = 'German'
}

export enum GeminiVoice {
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir',
  ZEPHYR = 'Zephyr'
}