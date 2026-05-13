import asyncHandler from 'express-async-handler';
import School from '../models/School.js';

// @desc   Get current school's public info (called on app load — no auth required)
// @route  GET /api/school/current
export const getCurrentSchool = asyncHandler(async (req, res) => {
  if (!req.school) {
    // Apex domain / bare localhost — no school context, not an error
    return res.json(null);
  }
  const { _id, name, subdomain, logoUrl, primaryColor, timezone, currency, plan } = req.school;
  res.json({ _id, name, subdomain, logoUrl, primaryColor, timezone, currency, plan });
});

// @desc   Get full school settings (admin only)
// @route  GET /api/school/settings
export const getSchoolSettings = asyncHandler(async (req, res) => {
  const school = await School.findById(req.school._id);
  res.json(school);
});

// @desc   Update school branding / settings (admin only)
// @route  PUT /api/school/settings
export const updateSchoolSettings = asyncHandler(async (req, res) => {
  const { name, address, phone, email, logoUrl, primaryColor, timezone, currency } = req.body;
  const school = await School.findById(req.school._id);
  if (!school) { res.status(404); throw new Error('School not found'); }

  if (name)         school.name         = name;
  if (address)      school.address      = address;
  if (phone)        school.phone        = phone;
  if (email)        school.email        = email;
  if (logoUrl)      school.logoUrl      = logoUrl;
  if (primaryColor) school.primaryColor = primaryColor;
  if (timezone)     school.timezone     = timezone;
  if (currency)     school.currency     = currency;

  const updated = await school.save();
  res.json(updated);
});

// @desc   Save a custom domain for this school (admin only)
// @route  PUT /api/school/custom-domain
export const setCustomDomain = asyncHandler(async (req, res) => {
  const { customDomain } = req.body;
  if (!customDomain) { res.status(400); throw new Error('customDomain is required'); }

  // Ensure the domain isn't already claimed by another school
  const conflict = await School.findOne({
    customDomain: customDomain.toLowerCase(),
    _id: { $ne: req.school._id },
  });
  if (conflict) { res.status(409); throw new Error('This domain is already in use'); }

  const school = await School.findById(req.school._id);
  school.customDomain         = customDomain.toLowerCase();
  school.customDomainVerified = false; // reset verification on domain change
  await school.save();

  res.json({
    message: 'Custom domain saved. Add the DNS record below, then contact support to verify.',
    customDomain: school.customDomain,
    // Instructions for the school's IT admin
    dnsInstructions: {
      type: 'CNAME',
      name: customDomain,
      value: `${school.subdomain}.myschoolsaas.com`,
      // OR an A record pointing to the server IP — document both options
    },
  });
});

// @desc   Mark a custom domain as verified (super admin triggers this, or a webhook)
// @route  POST /api/school/custom-domain/verify  (internal — called by super admin)
export const verifyCustomDomain = asyncHandler(async (req, res) => {
  const school = await School.findById(req.school._id);
  if (!school.customDomain) { res.status(400); throw new Error('No custom domain configured'); }

  // TODO: real DNS verification — check that customDomain has a CNAME → our server
  // For now, mock as always verified
  school.customDomainVerified = true;
  await school.save();

  res.json({ message: 'Custom domain verified', customDomain: school.customDomain });
});
