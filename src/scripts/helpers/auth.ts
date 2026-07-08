import type { Request, Response } from 'express';
import '#src/scripts/helpers/sessionHelpers.js';
import config from '#config.js';
import { HTTP } from '#src/services/api/base/constants.js';
import { isAllowedRelayTarget, parseRelayState, verifyRelayState } from '#utils/server/auth.relay.js';

/**
 * If the state encodes a signed relay target for a different host, validates
 * the signature and redirects the callback to that ephemeral environment.
 * @param {object} data - The parsed auth code response.
 * @param {string} data.code - The authorisation code from Entra.
 * @param {string} data.state - The OAuth state parameter.
 * @param {Request} req - The Express request.
 * @param {Response} res - The Express response.
 * @returns {boolean} true if the response was handled (redirected or rejected), false if
 *          the callback should be processed locally.
 */
export function handleRelay(
  data: { code: string; state: string },
  req: Request,
  res: Response,
): boolean {
  const relayState = parseRelayState(data.state);
  if (relayState === null) return false;

  const { target } = relayState;
  if (
    !verifyRelayState(relayState, config.session.secret) ||
    !isAllowedRelayTarget(target)
  ) {
    res.status(HTTP.BAD_REQUEST).send("Invalid relay target");
    return true;
  }

  const targetUrl = new URL(target);
  if (targetUrl.hostname === req.hostname) {
    return false;
  }

  targetUrl.pathname = "/auth/callback";
  targetUrl.searchParams.set("code", data.code);
  targetUrl.searchParams.set("state", data.state);

  res.set("Cache-Control", "no-store");
  res.redirect(targetUrl.toString());
  return true;
}
