/**
 * Custom data stored on each Socket.IO socket connection.
 */
export interface SocketData {
  sessionId?: string;
  userId?: string;
  caseReference?: string;
}

/**
 * Socket.IO client socket interface
 */
export interface Socket {
  connected: boolean;
  emit(event: string, ...args: unknown[]): void;
  on<T extends unknown[]>(event: string, callback: (...args: T) => void): void;
}

/**
 * Payload sent when the number of active viewers for a case changes.
 */
export interface ViewersUpdatedData {
  caseReference: string;
  viewerCount: number;
}

/**
 * Browser Window interface extended with the optional Socket.IO
 */
export interface WindowWithIO extends Window {
  io?: (options?: Record<string, unknown>) => Socket;
}
