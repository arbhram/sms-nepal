import mongoose from 'mongoose';
import School from '../models/School.js';
import User from '../models/User.js';
import { tenantContext } from '../tenant/context.js';
import { seedAccounts } from '../seeders/seedAccounts.js';

/**
 * Atomically provisions a new school tenant:
 *   1. Creates the School document
 *   2. Seeds the default Chart of Accounts (inside tenant context)
 *   3. Creates the initial admin User (inside tenant context)
 *
 * On any failure, rolls back the school + all partially-seeded data so the
 * DB is never left in a half-provisioned state.
 *
 * @returns {Promise<School>} the created school document
 */
export async function provisionSchool({
  name,
  subdomain,
  email,
  phone,
  address,
  timezone,
  currency,
  plan,
  trialDays,
  adminEmail,
  adminPassword,
  adminName,
}) {
  let school = null;

  try {
    school = await School.create({
      name,
      subdomain:   subdomain.toLowerCase(),
      email:       email || undefined,
      phone:       phone || undefined,
      address:     address || undefined,
      timezone:    timezone  || 'Asia/Kathmandu',
      currency:    currency  || 'NPR',
      plan:        plan      || 'trial',
      trialEndsAt: new Date(Date.now() + (Number(trialDays) || 30) * 86_400_000),
      isActive:    true,
    });

    await tenantContext.run({ schoolId: school._id }, async () => {
      await seedAccounts();

      await User.create({
        name:     adminName || 'Admin',
        email:    adminEmail.toLowerCase(),
        password: adminPassword,
        role:     'admin',
        isActive: true,
        schoolId: school._id,
      });
    });

    // Stub: wire Resend here when first paying school is onboarded
    console.log(
      `📧 [STUB EMAIL] Would send to ${adminEmail}: ` +
      `"Welcome to ${name} — login at https://${subdomain}.myschoolsaas.com " ` +
      `with password: ${adminPassword}`,
    );

    return school;
  } catch (err) {
    // Manual rollback — clean up any partial data written before the failure
    if (school) {
      const sid = school._id;
      await Promise.allSettled([
        School.deleteOne({ _id: sid }),
        mongoose.connection.collection('accounts').deleteMany({ schoolId: sid }),
        mongoose.connection.collection('users').deleteMany({ schoolId: sid }),
      ]);
      console.error(`[PROVISION_ROLLBACK] Cleaned up partial data for school ${sid}`);
    }
    throw err;
  }
}
