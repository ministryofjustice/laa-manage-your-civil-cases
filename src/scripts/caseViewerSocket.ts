/**
 * Case Viewer Socket Client
 *
 * Manages real-time notifications for case viewing status.
 * Shows MOJ Alert when other users are viewing the same case.
 */

/* global io */
import { devLog, devWarn, devError } from './helpers/devLogger.js';
/**
 * Socket.IO client socket interface
 */
interface Socket {
  connected: boolean;
  emit(event: string, ...args: unknown[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void;
}

interface ViewersUpdatedData {
  caseReference: string;
  viewerCount: number;
}

interface WindowWithIO extends Window {
  io?: (options?: Record<string, unknown>) => Socket;
}

declare const window: WindowWithIO;

(function () {
  'use strict';

  /** Interval in milliseconds for sending heartbeat to maintain viewer presence */
  const HEARTBEAT_INTERVAL = 15000; // 15 seconds

  /** Socket.IO client instance */
  let socket: Socket | null = null;

  /** Timer for periodic heartbeat emissions */
  let heartbeatTimer: NodeJS.Timeout | null = null;

  /** Currently viewed case reference */
  let currentCaseReference: string | null = null;

  /** Current user's session ID */
  let currentSessionId: string | null = null;

  /**
   * Initializes Socket.IO connection with server.
   * Sets up event handlers for connection, disconnection, and real-time updates.
   *
   * @returns {Socket | null} Socket.IO client instance or null if Socket.IO library not loaded
   */
  function initSocket(): Socket | null {
    if (typeof window.io === 'undefined') {
      devError('[CaseViewer] Socket.IO client library not loaded');
      return null;
    }

    devLog('[CaseViewer] Initializing Socket.IO connection...');
    const socketInstance = window.io!({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', function () {
      devLog('[CaseViewer] ✓ Socket.IO connected');
      if (currentCaseReference && currentSessionId) {
        devLog('[CaseViewer] Re-joining case after reconnect: ' + currentCaseReference);
        joinCase(currentCaseReference, currentSessionId);
      }
    });

    socketInstance.on('disconnect', function () {
      devLog('[CaseViewer] ✗ Socket.IO disconnected');
      stopHeartbeat();
    });

    socketInstance.on('viewers-updated', function (data: ViewersUpdatedData) {
      devLog('[CaseViewer] Received viewers-updated: ' + JSON.stringify(data));
      updateViewerAlert(data.viewerCount);
    });

    socketInstance.on('heartbeat-ack', function () {
      devLog('[CaseViewer] ♥ Heartbeat acknowledged');
    });

    socketInstance.on('error', function (error: Error) {
      devError('[CaseViewer] ✗ Socket.IO error: ' + error.message);
    });

    return socketInstance;
  }

  /**
   * Joins a case-specific Socket.IO room to receive real-time viewer updates.
   * Emits join-case event to server and starts heartbeat mechanism.
   *
   * @param {string} caseReference - The unique reference number of the case
   * @param {string} sessionId - The user's session identifier
   * @returns {void}
   */
  function joinCase(caseReference: string, sessionId: string): void {
    if (!socket || !socket.connected) {
      devWarn('[CaseViewer] Socket not connected, cannot join case');
      return;
    }

    const userId = getUserId();

    devLog('[CaseViewer] Joining case: ' + JSON.stringify({ caseReference, sessionId, userId }));

    socket.emit('join-case', {
      caseReference: caseReference,
      sessionId: sessionId,
      userId: userId
    });

    currentCaseReference = caseReference;
    currentSessionId = sessionId;

    startHeartbeat();
  }

  /**
   * Leaves the current case room and stops heartbeat mechanism.
   * Notifies server that user is no longer viewing the case.
   *
   * @returns {void}
   */
  function leaveCase() {
    if (!socket || !currentCaseReference || !currentSessionId) {
      return;
    }

    devLog('[CaseViewer] Leaving case: ' + currentCaseReference);
    socket.emit('leave-case', {
      caseReference: currentCaseReference,
      sessionId: currentSessionId
    });

    stopHeartbeat();
    currentCaseReference = null;
    currentSessionId = null;
  }

  /**
   * Starts periodic heartbeat emissions to maintain viewer presence in Redis.
   * Heartbeats are sent every 15 seconds to refresh the 30-second TTL.
   *
   * @returns {void}
   */
  function startHeartbeat() {
    stopHeartbeat(); // Clear any existing timer

    heartbeatTimer = setInterval(function () {
      if (socket && socket.connected && currentCaseReference && currentSessionId) {
        socket.emit('heartbeat', {
          caseReference: currentCaseReference,
          sessionId: currentSessionId
        });
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stops the heartbeat timer and clears the interval.
   * Called when user leaves page or loses connection.
   *
   * @returns {void}
   */
  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  /**
   * Retrieves the user identifier from meta tag or falls back to session ID.
   * Used to identify users in the viewer tracking system.
   *
   * @returns {string} User email address or session ID or 'anonymous'
   */
  function getUserId(): string {
    // Try to get from meta tag or window object
    const userEmail = document.querySelector('meta[name="user-email"]') as HTMLMetaElement;
    if (userEmail && userEmail.content) {
      devLog('[CaseViewer] Found user email: ' + userEmail.content);
      return userEmail.content;
    }

    // Fallback to session ID
    devLog('[CaseViewer] No user email found, using session ID: ' + (currentSessionId || 'anonymous'));
    return currentSessionId || 'anonymous';
  }

  /**
   * Updates the MOJ Alert banner showing how many other users are viewing the case.
   * Hides alert when no other viewers, shows warning alert otherwise.
   *
   * @param {number} viewerCount - Total number of viewers including current user
   * @returns {void}
   */
  function updateViewerAlert(viewerCount: number): void {
    const alertContainer = document.getElementById('case-viewer-alert');
    const singleViewerAlert = document.getElementById('viewer-alert-single');
    const multipleViewersAlert = document.getElementById('viewer-alert-multiple');

    if (!alertContainer || !singleViewerAlert || !multipleViewersAlert) {
      devWarn('[CaseViewer] Alert container or templates not found in DOM');
      return;
    }

    // viewerCount includes current user; we want to show "other" users
    const otherViewers = Math.max(0, viewerCount - 1);
    devLog(`[CaseViewer] Updating alert - total viewers: ${viewerCount}, other viewers: ${otherViewers}`);
    
    if (otherViewers === 0) {
      // No other viewers, hide all alerts
      alertContainer.hidden = true;
      singleViewerAlert.hidden = true;
      multipleViewersAlert.hidden = true;
    } else if (otherViewers === 1) {
      // Show single viewer alert
      alertContainer.hidden = false;
      singleViewerAlert.hidden = false;
      multipleViewersAlert.hidden = true;
    } else {
      // Show multiple viewers alert and update the text
      const alertText = multipleViewersAlert.querySelector('.moj-alert__paragraph');
      if (alertText) {
        alertText.textContent = `${otherViewers} other users are currently viewing this case`;
      }
      alertContainer.hidden = false;
      singleViewerAlert.hidden = true;
      multipleViewersAlert.hidden = false;
    }
  }

  /**
   * Initializes case viewer tracking on case details pages.
   * Sets up Socket.IO connection, joins case room, and handles page lifecycle events.
   *
   * @returns {void}
   */
  function initCaseViewerTracking() {
    devLog('[CaseViewer] Initializing case viewer tracking...');

    // Check if we're on a case details page
    const caseElement = document.querySelector('[data-case-reference]');
    if (!caseElement) {
      devLog('[CaseViewer] Not on a case details page (no data-case-reference element)');
      return;
    }

    const caseReference = caseElement.getAttribute('data-case-reference');
    const sessionId = caseElement.getAttribute('data-session-id');

    devLog('[CaseViewer] Found case data: ' + JSON.stringify({ caseReference, sessionId }));

    if (!caseReference || !sessionId) {
      devWarn('[CaseViewer] Case reference or session ID not found');
      return;
    }

    // Set current case info before initializing socket so connect handler can use it
    currentCaseReference = caseReference;
    currentSessionId = sessionId;

    // Initialize socket connection
    socket = initSocket();

    if (!socket) {
      return;
    }

    // Join case - either now if already connected, or when connect event fires
    if (socket.connected) {
      devLog('[CaseViewer] Socket already connected, joining immediately');
      joinCase(caseReference, sessionId);
    } else {
      devLog('[CaseViewer] Socket connecting, will join when connected');
    }

    // Leave case when navigating away
    window.addEventListener('beforeunload', function () {
      leaveCase();
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopHeartbeat();
      } else if (currentCaseReference && currentSessionId) {
        startHeartbeat();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCaseViewerTracking);
  } else {
    initCaseViewerTracking();
  }
})();
