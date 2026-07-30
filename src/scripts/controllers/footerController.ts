import type { Request, Response } from 'express';

/**
 * Renders the cookies page.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export function showHelpPage(req: Request, res: Response): void {
    res.render('footer/help');
}