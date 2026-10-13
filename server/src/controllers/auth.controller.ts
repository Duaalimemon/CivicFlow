import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db, DatabaseUnavailableError, PersistenceError } from '../db/store.js';
import { Role, User } from '../types/index.js';
import { getJwtSecret } from '../middlewares/auth.middleware.js';

const JWT_EXPIRES_IN = '8h';

// Validation Schemas - Public registration is strictly restricted to CITIZEN role
export const RegisterSchema = z.object({
  email: z.string().email('Valid institutional or citizen email required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.string().optional(), // Accepted for payload compatibility, but server forces CITIZEN
  badgeNumber: z.string().optional(),
  department: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response) => {
  try {
    const validated = RegisterSchema.parse(req.body);

    const existing = await db.findUserByEmailAsync(validated.email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Account with this email already exists in municipal registry.',
      });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    // SECURITY: Always enforce CITIZEN role for public registration regardless of client payload
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: validated.email,
      passwordHash,
      fullName: validated.fullName,
      role: 'CITIZEN',
      badgeNumber: undefined,
      department: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.createUserAsync(newUser);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    const { passwordHash: _, ...userProfile } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Institutional account registered successfully.',
      user: userProfile,
      token, // Also returned for API clients/tools
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    if (error instanceof DatabaseUnavailableError || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: 'DatabaseUnavailable',
        message: 'Municipal database service is currently unavailable.',
      });
    }
    if (error instanceof PersistenceError || error.statusCode === 500) {
      return res.status(500).json({
        success: false,
        error: 'PersistenceFailure',
        message: error.message || 'An unexpected persistence failure occurred.',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await db.findUserByEmailAsync(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password rejected.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...userProfile } = user;

    return res.json({
      success: true,
      message: 'Authenticated successfully.',
      user: userProfile,
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    if (error instanceof DatabaseUnavailableError || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: 'DatabaseUnavailable',
        message: 'Municipal database service is currently unavailable.',
      });
    }
    if (error instanceof PersistenceError || error.statusCode === 500) {
      return res.status(500).json({
        success: false,
        error: 'PersistenceFailure',
        message: error.message || 'An unexpected persistence failure occurred.',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return res.json({
    success: true,
    message: 'Institutional session terminated.',
  });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    const user = await db.findUserByIdAsync(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { passwordHash: _, ...userProfile } = user;
    return res.json({
      success: true,
      user: userProfile,
    });
  } catch (error: any) {
    if (error instanceof DatabaseUnavailableError || error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: 'DatabaseUnavailable',
        message: 'Municipal database service is currently unavailable.',
      });
    }
    if (error instanceof PersistenceError || error.statusCode === 500) {
      return res.status(500).json({
        success: false,
        error: 'PersistenceFailure',
        message: error.message || 'An unexpected persistence failure occurred.',
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
