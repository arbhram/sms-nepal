import SystemConfig from '../models/SystemConfig.js';
import FeeStructure from '../models/FeeStructure.js';
import { currentAcademicYear } from '../utils/nepaliDate.js';

export async function getConfig(req, res) {
  try {
    const config = await SystemConfig.getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateConfig(req, res) {
  try {
    const allowed = [
      'schoolName', 'address', 'phone', 'email', 'website',
      'logoUrl', 'district', 'province', 'registrationNo', 'principalName',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const config = await SystemConfig.findOneAndUpdate({}, updates, { new: true, upsert: true });
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/system-config/upgrade-year
 * body: { newYear: "2084", copyFeeStructures: true, notes: "..." }
 *
 * - Archives the current academic year
 * - Sets currentAcademicYear to newYear
 * - Optionally copies all FeeStructure documents to the new year
 */
export async function upgradeAcademicYear(req, res) {
  try {
    const config = await SystemConfig.getConfig();
    const { newYear, copyFeeStructures = true, notes = '' } = req.body;

    if (!newYear) return res.status(400).json({ message: 'newYear is required' });
    if (newYear === config.currentAcademicYear) {
      return res.status(400).json({ message: 'newYear is the same as the current year' });
    }

    const oldYear = config.currentAcademicYear;

    // Archive old year
    config.academicYearHistory.push({
      year:      oldYear,
      startedAt: config.updatedAt,
      endedAt:   new Date(),
      notes,
    });

    config.currentAcademicYear = newYear;
    await config.save();

    let copied = 0;
    if (copyFeeStructures) {
      const oldStructures = await FeeStructure.find({ academicYear: oldYear });
      for (const old of oldStructures) {
        const exists = await FeeStructure.findOne({ class: old.class, academicYear: newYear });
        if (!exists) {
          await FeeStructure.create({
            class:        old.class,
            academicYear: newYear,
            name:         old.name,
            components:   old.components,
            isActive:     true,
            createdBy:    req.user._id,
          });
          copied++;
        }
      }
    }

    res.json({
      message:    `Academic year upgraded from ${oldYear} to ${newYear}`,
      oldYear,
      newYear,
      structuresCopied: copied,
      config,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
