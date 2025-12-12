import { DubbingResult } from './types';

export const MOCK_RESULTS: DubbingResult[] = [
  {
    id: '1',
    startTime: '00:00:01.500',
    endTime: '00:00:04.000',
    originalText: 'The derivative represents the rate of change.',
    optimizedText: 'La derivada muestra la tasa de cambio.',
    reasoning: 'Condensed "represents" to "muestra" to match the speaker\'s faster lip movement.'
  },
  {
    id: '2',
    startTime: '00:00:04.200',
    endTime: '00:00:07.800',
    originalText: 'If we look at the graph, the slope is increasing rapidly.',
    optimizedText: 'Al ver el gráfico, la pendiente sube rápido.',
    reasoning: 'Simplified "is increasing rapidly" to "sube rápido" to fit the 3.6s timing window.'
  },
  {
    id: '3',
    startTime: '00:00:08.100',
    endTime: '00:00:11.000',
    originalText: 'Therefore, the function must be continuous here.',
    optimizedText: 'Por eso, la función debe ser continua aquí.',
    reasoning: 'Direct translation aligned perfectly with the pause at the end of the sentence.'
  }
];

export const THEME_COLOR = '#F97316'; // Dubby Orange