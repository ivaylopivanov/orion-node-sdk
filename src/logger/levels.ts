export const EMERGENCY = 0; // system is unusable
export const ALERT = 1; // action must be taken immediately
export const CRITICAL = 2; // critical conditions
export const ERR = 3; // error conditions
export const ERROR = 3; // because people WILL typo
export const WARNING = 4; // warning conditions
export const NOTICE = 5; // normal, but significant, condition
export const INFO = 6; // informational message
export const DEBUG = 7; // debug level message

export function levelToString(level: number): string {
  switch (level) {
    case ALERT:
      return 'Alert';
    case WARNING:
      return 'Warning';
    case CRITICAL:
      return 'Critical';
    case EMERGENCY:
      return 'Emergency';
    case ERROR:
      return 'Error';
    case INFO:
      return 'Info';
    case NOTICE:
      return 'Notice';
    case DEBUG:
      return 'Debug';
    default:
      return 'Debug';
  }
}
