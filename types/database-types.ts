import { SQLiteDatabase } from '../utils/sqliteSetup.js';

// Using module augmentation to extend Express Request
declare module 'express-serve-static-core' {
  interface Request {
    db: SQLiteDatabase;
  }
}
