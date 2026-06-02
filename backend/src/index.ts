import app from './app';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (parent of backend/) then fallback to backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Backend listening on http://0.0.0.0:${port}`);
});
