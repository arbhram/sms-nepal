import AuditLog from '../models/AuditLog.js';

/**
 * Write a super-admin audit entry.
 * Fire-and-forget: never throws, never blocks the response.
 *
 * @param {object} opts
 * @param {import('express').Request} opts.req   - express request (provides actor + IP)
 * @param {string}  opts.action                  - dot-notation verb, e.g. 'school.suspended'
 * @param {string}  [opts.targetType]            - 'school' | 'user' | ...
 * @param {*}       [opts.targetId]
 * @param {string}  [opts.targetName]
 * @param {*}       [opts.schoolId]
 * @param {object}  [opts.changes]               - { before, after }
 * @param {string}  [opts.reason]
 */
export function audit({ req, action, targetType, targetId, targetName, schoolId, changes, reason }) {
  AuditLog.create({
    actorType: 'super_admin',
    actorId:   req.superAdmin._id,
    actorName: req.superAdmin.name,
    action,
    targetType,
    targetId,
    targetName,
    schoolId,
    changes,
    reason,
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip,
    userAgent: req.headers['user-agent'],
  }).catch((err) => console.error('[AUDIT_LOG_ERROR]', err.message));
}
