import { Application, Request, Response, NextFunction } from 'express';
import { initializeDB } from '../utils/sqliteSetup.js';

// Import the types for Express request augmentation
import '../types/database-types.js';

/**
 * Sets up the database and attaches it to the request object.
 * @param {Application} app - The Express application instance.
 */
export const setupDB = async (app: Application): Promise<void> => {
  try {
    const db = await initializeDB();
    
    /**
     * Middleware to attach the database to the request object.
     * @param {Request} req - The request object.
     * @param {Response} res - The response object.
     * @param {NextFunction} next - The next middleware function.
     */
    const dbRequest = (req: Request, res: Response, next: NextFunction): void => {
      req.db = db;
      next();
    };

    app.use(dbRequest);
    console.log('Database initialized and middleware set up.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};
