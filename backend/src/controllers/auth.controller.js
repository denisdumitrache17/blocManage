import env, { isProduction } from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sanitizeUser } from '../utils/sanitize.js';
import {
  getCurrentUser,
  loginUser,
  registerTenant,
  registerHoa,
  registerFirm
} from '../services/auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/'
};

const appendAuthCookie = (res, token) => {
  res.cookie(env.AUTH_COOKIE_NAME, token, cookieOptions);
};

// ── Register Tenant ─────────────────────────────────────

export const registerTenantController = asyncHandler(async (req, res) => {
  const result = await registerTenant(req.body);

  appendAuthCookie(res, result.token);

  res.status(201).json({
    message: 'Cont creat. Asteapta aprobarea asociatiei.',
    token: result.token,
    user: sanitizeUser(result.user)
  });
});

// ── Register HOA ────────────────────────────────────────

export const registerHoaController = asyncHandler(async (req, res) => {
  const result = await registerHoa(req.body);

  appendAuthCookie(res, result.token);

  res.status(201).json({
    message: 'Asociatia a fost inregistrata cu succes.',
    token: result.token,
    user: sanitizeUser(result.user)
  });
});

// ── Register Firm ───────────────────────────────────────

export const registerFirmController = asyncHandler(async (req, res) => {
  const result = await registerFirm(req.body);

  appendAuthCookie(res, result.token);

  res.status(201).json({
    message: 'Firma a fost inregistrata cu succes.',
    token: result.token,
    user: sanitizeUser(result.user)
  });
});

// ── Login / Logout / Me ─────────────────────────────────

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body);

  appendAuthCookie(res, result.token);

  res.status(200).json({
    message: 'Autentificare reusita',
    token: result.token,
    user: sanitizeUser(result.user)
  });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.AUTH_COOKIE_NAME, cookieOptions);
  res.status(200).json({ message: 'Logout efectuat cu succes' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.authUser.id);

  res.status(200).json({
    user: sanitizeUser(user)
  });
});