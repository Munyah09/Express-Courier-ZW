import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { db } from '../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refreshsecret';

export const signIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { data: dbUser, error } = await db
    .from('users')
    .select('id, email, first_name, last_name, phone, password_hash, is_active, role:roles(name)')
    .eq('email', email)
    .single();

  if (error || !dbUser) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  if (!dbUser.is_active) {
    return res.status(403).json({ error: 'Account is disabled.' });
  }

  if (dbUser.password_hash) {
    const valid = await bcrypt.compare(password, dbUser.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
  }

  const user = {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    role: (dbUser.role as any)?.name || 'staff'
  };

  const accessToken = jwt.sign({ user }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ user }, REFRESH_SECRET, {
    expiresIn: '30d'
  } as jwt.SignOptions);

  res.json({ accessToken, refreshToken, user });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as { user: unknown };
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    } as jwt.SignOptions);
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token.' });
  }
};
