import type { Request, Response } from 'express';

/** 
 * Opens the cookies page.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Promise<void>} Promise that resolves when the request is processed
 */
export async function showCookiesPage(req: Request, res: Response): Promise<void> {
  res.render('footer/cookies');
  return;
}