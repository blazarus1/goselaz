const crypto = require('node:crypto');

const SESSION_COOKIE_NAME = 'pi_dashboard_admin';
const sessions = new Map();

function getSessionHours() {
  const configuredHours = Number(process.env.ADMIN_SESSION_HOURS || 12);

  return Number.isFinite(configuredHours) && configuredHours > 0
    ? configuredHours
    : 12;
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const separatorIndex = cookie.indexOf('=');

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = cookie.slice(0, separatorIndex);
      const value = cookie.slice(separatorIndex + 1);

      cookies[key] = decodeURIComponent(value);

      return cookies;
    }, {});
}

function isLocalNetworkAddress(address = '') {
  const ip = address.replace('::ffff:', '');

  if (ip === '::1' || ip === '127.0.0.1') {
    return true;
  }

  if (ip.startsWith('10.')) {
    return true;
  }

  if (ip.startsWith('192.168.')) {
    return true;
  }

  const match = ip.match(/^172\.(\d+)\./);

  if (match) {
    const secondOctet = Number(match[1]);

    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

function localNetworkOnly(req, res, next) {
  const remoteAddress = req.socket.remoteAddress || '';

  if (!isLocalNetworkAddress(remoteAddress)) {
    return res.status(403).json({
      error: 'Admin access is available only on the local network.'
    });
  }

  return next();
}

function createSession(res) {
  const token = crypto.randomBytes(32).toString('hex');

  const expiresAt = Date.now() + (
    getSessionHours() * 60 * 60 * 1000
  );

  sessions.set(token, { expiresAt });

  res.setHeader(
    'Set-Cookie',
    [
      `${SESSION_COOKIE_NAME}=${token}`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${getSessionHours() * 60 * 60}`
    ].join('; ')
  );
}

function clearSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];

  if (token) {
    sessions.delete(token);
  }

  res.setHeader(
    'Set-Cookie',
    [
      `${SESSION_COOKIE_NAME}=`,
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      'Max-Age=0'
    ].join('; ')
  );
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];

  if (!token) {
    return null;
  }

  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);

    return null;
  }

  return session;
}

function requireAdmin(req, res, next) {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({
      error: 'Admin login is required.'
    });
  }

  return next();
}

module.exports = {
  localNetworkOnly,
  createSession,
  clearSession,
  getSession,
  requireAdmin
};