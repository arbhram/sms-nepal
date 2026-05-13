import mongoose from 'mongoose';
import { getSchoolId } from './context.js';

// All Mongoose query methods that accept filter conditions
const QUERY_METHODS = [
  'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace',
  'countDocuments', 'exists',
  'updateOne', 'updateMany', 'replaceOne',
  'deleteOne', 'deleteMany',
  'distinct',
];

export function tenantPlugin(schema) {
  // Schemas that opt out (e.g. School, global config) set { tenantScoped: false }
  if (schema.options.tenantScoped === false) return;

  // Add schoolId to every tenant-scoped schema
  schema.add({
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      index: true,
    },
  });

  // ── Query hooks ────────────────────────────────────────────────────────────
  for (const method of QUERY_METHODS) {
    schema.pre(method, function () {
      // Escape hatch for authMiddleware user lookup, seeds, etc.
      if (this.options?._skipTenant || this._skipTenant) return;

      const schoolId = getSchoolId();
      if (!schoolId) {
        throw new Error(
          `Tenant context missing — call this inside tenantContext.run() or pass .setOptions({ _skipTenant: true })`,
        );
      }

      const existing = this._conditions?.schoolId;
      if (existing != null) {
        // Caller explicitly passed a schoolId — verify it matches context
        if (existing.toString() !== schoolId.toString()) {
          throw new Error(
            `Cross-tenant query blocked: context has ${schoolId}, query has ${existing}`,
          );
        }
        return; // already correctly scoped
      }

      this.where({ schoolId });
    });
  }

  // ── Aggregate hook — prepend $match stage ─────────────────────────────────
  schema.pre('aggregate', function () {
    if (this.options?._skipTenant) return;

    const schoolId = getSchoolId();
    if (!schoolId) {
      throw new Error(`Tenant context missing for aggregate`);
    }

    const pipeline = this.pipeline();
    const first = pipeline[0];
    if (first?.$match?.schoolId != null) {
      if (first.$match.schoolId.toString() !== schoolId.toString()) {
        throw new Error(`Cross-tenant aggregate blocked`);
      }
      return; // already scoped
    }

    pipeline.unshift({ $match: { schoolId: new mongoose.Types.ObjectId(String(schoolId)) } });
  });

  // estimatedDocumentCount ignores filters by design — block it in tenant context
  schema.pre('estimatedDocumentCount', function () {
    if (getSchoolId()) {
      throw new Error(
        `estimatedDocumentCount is not tenant-aware. Use countDocuments({}) instead.`,
      );
    }
  });

  // ── Save hook — context always wins over any supplied schoolId ────────────
  schema.pre('save', function (next) {
    if (this.$locals?._skipTenant) return next();
    const schoolId = getSchoolId();
    if (!schoolId) return next(); // seeds / migration scripts: allow unscoped saves
    this.schoolId = schoolId;
    next();
  });

  // ── insertMany hook ────────────────────────────────────────────────────────
  schema.pre('insertMany', function (next, docs) {
    if (this._skipTenant) return next();
    const schoolId = getSchoolId();
    if (!schoolId) return next(); // seeds / migration scripts
    for (const doc of docs) {
      doc.schoolId = schoolId; // context always wins
    }
    next();
  });
}
