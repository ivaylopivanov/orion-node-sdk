import * as LOGGER_LEVELS from './levels';

export const BLACK = 30;
export const RED = 31;
export const GREEN = 32;
export const YELLOW = 33;
export const BLUE = 34;
export const MAGENTA = 35;
export const CYAN = 36;
export const WHITE = 37;

export function getColorForLevel(level: number): number {
  switch (level) {
    case LOGGER_LEVELS.ALERT:
      return YELLOW;
    case LOGGER_LEVELS.WARNING:
      return YELLOW;
    case LOGGER_LEVELS.CRITICAL:
      return MAGENTA;
    case LOGGER_LEVELS.EMERGENCY:
      return MAGENTA;
    case LOGGER_LEVELS.ERROR:
      return RED;
    case LOGGER_LEVELS.INFO:
      return CYAN;
    case LOGGER_LEVELS.NOTICE:
      return GREEN;
    case LOGGER_LEVELS.DEBUG:
      return WHITE;
    default:
      return CYAN;
  }
}
