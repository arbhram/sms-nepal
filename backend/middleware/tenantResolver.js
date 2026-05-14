import asyncHandler from 'express-async-handler';
import School from '../models/School.js';

// Subdomains that belong to the platform, not to any tenant school
const RESERVED = new Set(['admin', 'www', 'api', 'app', 'mail', 'ftp', 'smtp']);

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'myschoolsaas.com').toLowerCase();
const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Extract the leftmost subdomain from a hostname.
 * Returns null if the hostname is the apex domain, a reserved subdomain,
 * or does not belong to ROOT_DOMAIN.
 *
 * Handles both production (kathmandu-academy.myschoolsaas.com) and
 * development (kathmandu-academy.localhost or kathmandu-academy.localhost:5173).
 */
function extractSubdomain(hostname) {
  const h = hostname.toLowerCase();

  // Dev: *.localhost[:port]
  if (IS_DEV) {
    const localhostMatch = h.match(/^([^.]+)\.localhost(:\d+)?$/);
    if (localhostMatch) return localhostMatch[1];
  }

  // Production: *.ROOT_DOMAIN
  if (h === ROOT_DOMAIN || h === `www.${ROOT_DOMAIN}`) return null;
  if (h.endsWith(`.${ROOT_DOMAIN}`)) {
    return h.slice(0, -(ROOT_DOMAIN.length + 1));
  }

  return null; // custom domain — handled separately below
}

/**
 * Resolves the school tenant from the incoming Host header.
 *
 * Sets req.school on success.  Does NOT throw for reserved/apex hosts so
 * that public routes (landing page API, super-admin) can pass through freely.
 *
 * Throws 404 only when a non-reserved subdomain or recognised custom domain
 * is present but no school is found — this prevents silent data leakage if
 * a subdomain is mis-typed or a tenant is deleted.
 */
export const tenantResolver = asyncHandler(async (req, res, next) => {
  // Dev escape hatch: pass X-Dev-Tenant header to bypass /etc/hosts requirement
  if (IS_DEV && req.headers['x-dev-tenant']) {
    const school = await School.findOne({
      subdomain: req.headers['x-dev-tenant'].toLowerCase(),
      isActive: true,
    });
    if (!school) { res.status(404); throw new Error(`Dev tenant "${req.headers['x-dev-tenant']}" not found`); }
    req.school = school;
    return next();
  }

  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
  const hostname = rawHost.split(':')[0].toLowerCase();

  const subdomain = extractSubdomain(hostname);

  if (subdomain !== null) {
    // Reserved subdomains belong to the platform — pass through without a school
    if (RESERVED.has(subdomain)) return next();

    // Regular tenant subdomain
    const school = await School.findOne({ subdomain, isActive: true });
    if (!school) { res.status(404); throw new Error(`School not found for subdomain: ${subdomain}`); }
    req.school = school;
    return next();
  }

  // Not a subdomain of ROOT_DOMAIN — check for custom domain
  const isApex = hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  // Deployment-platform hosts (Render, Vercel) are never tenant custom domains
  const isPlatformHost = hostname.endsWith('.onrender.com') || hostname.endsWith('.vercel.app');

  if (!isApex && !isLocalhost && !isPlatformHost) {
    // Looks like a custom domain (kathmandu-academy.edu.np)
    const school = await School.findOne({
      customDomain: hostname,
      customDomainVerified: true,
      isActive: true,
    });
    if (!school) { res.status(404); throw new Error(`No verified school found for domain: ${hostname}`); }
    req.school = school;
    return next();
  }

  // Apex domain or bare localhost — no school context (landing page / signup)
  next();
});
