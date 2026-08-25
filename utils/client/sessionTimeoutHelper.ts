/**
 * Client-side helper to warn the user before their SiLAS session expires,
 * instead of letting requireAuth silently redirect them through re-authentication.
 */

const WARNING_BEFORE_EXPIRY_MS = 2 * 60 * 1000; // Show the warning 2 minutes before expiry
const COUNTDOWN_TICK_MS = 1000;
const MS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;

/**
 * Formats remaining milliseconds as an "m:ss" countdown string.
 * @param {number} msRemaining Milliseconds remaining until expiry.
 * @returns {string} Formatted countdown, e.g. "1:05".
 */
function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.round(msRemaining / MS_IN_SECOND));
  const minutes = Math.floor(totalSeconds / SECONDS_IN_MINUTE);
  const seconds = totalSeconds % SECONDS_IN_MINUTE;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Reads the session expiry timestamp exposed by the server in a meta tag.
 * @returns {number | null} Expiry time in ms since epoch, or null if not present/invalid.
 */
function getSessionExpiresAt(): number | null {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="session-expires-at"]');
  if (meta === null) {
    return null;
  }
  const expiresAt = Number(meta.content);
  return Number.isFinite(expiresAt) ? expiresAt : null;
}

/**
 * Initializes the session timeout warning dialog and its countdown/auto sign-out timers.
 * @returns {void}
 */
export function initializeSessionTimeoutWarning(): void {
  const expiresAt = getSessionExpiresAt();
  const dialog = document.querySelector<HTMLDialogElement>('#session-timeout-dialog');
  const countdownEl = document.querySelector<HTMLElement>('#session-timeout-countdown');
  const stayButton = document.querySelector<HTMLButtonElement>('#session-timeout-stay-signed-in');

  if (expiresAt === null || dialog === null) {
    return;
  }

  let countdownTimer: ReturnType<typeof setInterval> | undefined;

  /** Redirects to the sign-out route. */
  const signOutNow = (): void => {
    window.location.href = '/auth/logout';
  };

  /** Updates the countdown text, signing the user out once time runs out. */
  const tickCountdown = (): void => {
    const msRemaining = expiresAt - Date.now();
    if (msRemaining <= 0) {
      if (countdownTimer !== undefined) {
        clearInterval(countdownTimer);
      }
      signOutNow();
      return;
    }
    if (countdownEl !== null) {
      countdownEl.textContent = formatCountdown(msRemaining);
    }
  };

  /** Opens the warning dialog and starts the countdown. */
  const showWarning = (): void => {
    if (dialog.open) {
      return;
    }
    dialog.showModal();
    tickCountdown();
    countdownTimer = setInterval(tickCountdown, COUNTDOWN_TICK_MS);
  };

  stayButton?.addEventListener('click', () => {
    // Re-runs the SiLAS/Entra auth flow to obtain a fresh token
    window.location.href = '/auth';
  });

  const msUntilWarning = expiresAt - WARNING_BEFORE_EXPIRY_MS - Date.now();
  if (msUntilWarning <= 0) {
    showWarning();
    return;
  }
  setTimeout(showWarning, msUntilWarning);
}
