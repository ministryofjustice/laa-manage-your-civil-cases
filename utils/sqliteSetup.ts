import sqlite3 from "sqlite3";
import type { Database } from "sqlite";
import { open } from "sqlite";

// Define the database type we'll use throughout the application
export type SQLiteDatabase = Database<sqlite3.Database, sqlite3.Statement>;

// In ESM, we need to access verbose differently
const sqlite3Verbose = sqlite3.verbose ? sqlite3.verbose() : sqlite3;

/**
 * Initializes and returns an SQLite database connection.
 *
 * @returns {Promise<SQLiteDatabase>} A promise that resolves to the SQLite database connection.
 */
export const initializeDB = async (): Promise<SQLiteDatabase> => {
    const db = await open({
      filename: ":memory:", // Using in-memory database for simplicity, use a file path for persistent storage
      driver: sqlite3Verbose.Database,
    });

    // Initialize your database schema here.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
      )
    `);

    return db;
};
