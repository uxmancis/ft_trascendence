import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || '0.0.0.0';
export const DB_PATH = process.env.DB_PATH || path.join('/data', 'sqlite.db');
export const NODE_ENV = process.env.NODE_ENV || 'development';
