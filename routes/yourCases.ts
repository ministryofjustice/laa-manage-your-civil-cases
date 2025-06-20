import express from 'express';
import type { Request, Response } from 'express';

// Create a new router for your-cases routes
const router = express.Router();

/* GET your cases page - defaults to new cases. */
router.get('/', function (req: Request, res: Response): void {
    res.render('cases/index', { activeTab: 'new' });
});

/* GET your cases - new tab. */
router.get('/new', function (req: Request, res: Response): void {
    res.render('cases/index', { activeTab: 'new' });
});

/* GET your cases - opened tab. */
router.get('/opened', function (req: Request, res: Response): void {
    res.render('cases/index', { activeTab: 'opened' });
});

/* GET your cases - accepted tab. */
router.get('/accepted', function (req: Request, res: Response): void {
    res.render('cases/index', { activeTab: 'accepted' });
});

/* GET your cases - closed tab. */
router.get('/closed', function (req: Request, res: Response): void {
    res.render('cases/index', { activeTab: 'closed' });
});

export default router;
