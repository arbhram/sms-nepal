import Account from '../models/Account.js';

/**
 * Default Chart of Accounts for a Nepal school ERP.
 * Run once on first setup (idempotent — skips existing codes).
 */
const COA = [
  // ── ASSETS ─────────────────────────────────────────────────────────────────
  { code: '1000', name: 'Assets',            type: 'asset',     normalBalance: 'debit', isGroup: true,  isSystem: true },
  { code: '1100', name: 'Current Assets',    type: 'asset',     normalBalance: 'debit', isGroup: true,  isSystem: true, parentCode: '1000' },
  { code: '1110', name: 'Cash in Hand',      type: 'asset',     normalBalance: 'debit', isGroup: false, isSystem: true, subtype: 'current_asset', parentCode: '1100' },
  { code: '1120', name: 'Cash at Bank',      type: 'asset',     normalBalance: 'debit', isGroup: false, isSystem: true, subtype: 'current_asset', parentCode: '1100' },
  { code: '1130', name: 'Petty Cash',        type: 'asset',     normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'current_asset', parentCode: '1100' },
  { code: '1140', name: 'eSewa / Khalti Wallet', type: 'asset', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'current_asset', parentCode: '1100' },
  { code: '1150', name: 'Accounts Receivable (Student Fees)', type: 'asset', normalBalance: 'debit', isGroup: false, isSystem: true, subtype: 'current_asset', parentCode: '1100' },
  { code: '1160', name: 'Advance Paid to Vendors', type: 'asset', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'current_asset', parentCode: '1100' },
  { code: '1200', name: 'Fixed Assets',      type: 'asset',     normalBalance: 'debit', isGroup: true,  isSystem: false, parentCode: '1000' },
  { code: '1210', name: 'Furniture & Fixtures', type: 'asset',  normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'fixed_asset', parentCode: '1200' },
  { code: '1220', name: 'Computers & Equipment', type: 'asset', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'fixed_asset', parentCode: '1200' },
  { code: '1230', name: 'Land & Building',   type: 'asset',     normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'fixed_asset', parentCode: '1200' },
  { code: '1240', name: 'Accumulated Depreciation', type: 'asset', normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'fixed_asset', parentCode: '1200' },

  // ── LIABILITIES ────────────────────────────────────────────────────────────
  { code: '2000', name: 'Liabilities',       type: 'liability', normalBalance: 'credit', isGroup: true,  isSystem: true },
  { code: '2100', name: 'Current Liabilities', type: 'liability', normalBalance: 'credit', isGroup: true, isSystem: true, parentCode: '2000' },
  { code: '2110', name: 'Accounts Payable',  type: 'liability', normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'current_liability', parentCode: '2100' },
  { code: '2120', name: 'Salary Payable',    type: 'liability', normalBalance: 'credit', isGroup: false, isSystem: true,  subtype: 'current_liability', parentCode: '2100' },
  { code: '2130', name: 'Advance Fees Received (Unearned)', type: 'liability', normalBalance: 'credit', isGroup: false, isSystem: true, subtype: 'current_liability', parentCode: '2100' },
  { code: '2140', name: 'TDS Payable',       type: 'liability', normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'current_liability', parentCode: '2100' },
  { code: '2150', name: 'Provident Fund Payable', type: 'liability', normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'current_liability', parentCode: '2100' },
  { code: '2200', name: 'Long-term Liabilities', type: 'liability', normalBalance: 'credit', isGroup: true, isSystem: false, parentCode: '2000' },
  { code: '2210', name: 'Bank Loan',         type: 'liability', normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'long_term_liability', parentCode: '2200' },

  // ── EQUITY ─────────────────────────────────────────────────────────────────
  { code: '3000', name: 'Equity',            type: 'equity',    normalBalance: 'credit', isGroup: true,  isSystem: true },
  { code: '3100', name: "Owner's Capital",   type: 'equity',    normalBalance: 'credit', isGroup: false, isSystem: true,  subtype: 'equity', parentCode: '3000' },
  { code: '3200', name: 'Retained Earnings', type: 'equity',    normalBalance: 'credit', isGroup: false, isSystem: true,  subtype: 'equity', parentCode: '3000' },
  { code: '3300', name: 'Current Year Surplus/Deficit', type: 'equity', normalBalance: 'credit', isGroup: false, isSystem: true,  subtype: 'equity', parentCode: '3000' },
  { code: '3400', name: 'Opening Balance Equity',       type: 'equity', normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'equity', parentCode: '3000' },

  // ── REVENUE ────────────────────────────────────────────────────────────────
  { code: '4000', name: 'Revenue',           type: 'revenue',   normalBalance: 'credit', isGroup: true,  isSystem: true },
  { code: '4100', name: 'Academic Revenue',  type: 'revenue',   normalBalance: 'credit', isGroup: true,  isSystem: true, parentCode: '4000' },
  { code: '4110', name: 'Tuition Fee Revenue', type: 'revenue', normalBalance: 'credit', isGroup: false, isSystem: true, subtype: 'revenue', parentCode: '4100' },
  { code: '4120', name: 'Admission Fee Revenue', type: 'revenue', normalBalance: 'credit', isGroup: false, isSystem: true, subtype: 'revenue', parentCode: '4100' },
  { code: '4130', name: 'Exam Fee Revenue',  type: 'revenue',   normalBalance: 'credit', isGroup: false, isSystem: true, subtype: 'revenue', parentCode: '4100' },
  { code: '4140', name: 'Library Fee Revenue', type: 'revenue', normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'revenue', parentCode: '4100' },
  { code: '4150', name: 'Identity Card Fee Revenue', type: 'revenue', normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'revenue', parentCode: '4100' },
  { code: '4200', name: 'Ancillary Revenue', type: 'revenue',   normalBalance: 'credit', isGroup: true,  isSystem: false, parentCode: '4000' },
  { code: '4210', name: 'Transport Fee Revenue', type: 'revenue', normalBalance: 'credit', isGroup: false, isSystem: true, subtype: 'revenue', parentCode: '4200' },
  { code: '4220', name: 'Hostel Fee Revenue', type: 'revenue',  normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'revenue', parentCode: '4200' },
  { code: '4230', name: 'Late Fine Revenue', type: 'revenue',   normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'revenue', parentCode: '4200' },
  { code: '4300', name: 'Other Income',      type: 'revenue',   normalBalance: 'credit', isGroup: true,  isSystem: false, parentCode: '4000' },
  { code: '4310', name: 'Donation Income',   type: 'revenue',   normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'other_income', parentCode: '4300' },
  { code: '4320', name: 'Grant Income',      type: 'revenue',   normalBalance: 'credit', isGroup: false, isSystem: false, subtype: 'other_income', parentCode: '4300' },

  // ── EXPENSES ───────────────────────────────────────────────────────────────
  { code: '5000', name: 'Expenses',          type: 'expense',   normalBalance: 'debit', isGroup: true,  isSystem: true },
  { code: '5100', name: 'Staff Expenses',    type: 'expense',   normalBalance: 'debit', isGroup: true,  isSystem: true, parentCode: '5000' },
  { code: '5110', name: 'Teacher Salary',    type: 'expense',   normalBalance: 'debit', isGroup: false, isSystem: true, subtype: 'operating_expense', parentCode: '5100' },
  { code: '5120', name: 'Staff Salary',      type: 'expense',   normalBalance: 'debit', isGroup: false, isSystem: true, subtype: 'operating_expense', parentCode: '5100' },
  { code: '5130', name: 'Bonus Expense',     type: 'expense',   normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5100' },
  { code: '5200', name: 'Administrative Expenses', type: 'expense', normalBalance: 'debit', isGroup: true, isSystem: false, parentCode: '5000' },
  { code: '5210', name: 'Rent Expense',      type: 'expense',   normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5200' },
  { code: '5220', name: 'Electricity Expense', type: 'expense', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5200' },
  { code: '5230', name: 'Water Expense',     type: 'expense',   normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5200' },
  { code: '5240', name: 'Internet & Telephone', type: 'expense', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5200' },
  { code: '5250', name: 'Stationery & Supplies', type: 'expense', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5200' },
  { code: '5260', name: 'Printing & Publication', type: 'expense', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5200' },
  { code: '5300', name: 'Academic Expenses', type: 'expense',   normalBalance: 'debit', isGroup: true,  isSystem: false, parentCode: '5000' },
  { code: '5310', name: 'Library Expense',   type: 'expense',   normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5300' },
  { code: '5320', name: 'Lab Expense',       type: 'expense',   normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5300' },
  { code: '5330', name: 'Sports Expense',    type: 'expense',   normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5300' },
  { code: '5400', name: 'Maintenance',       type: 'expense',   normalBalance: 'debit', isGroup: true,  isSystem: false, parentCode: '5000' },
  { code: '5410', name: 'Repair & Maintenance', type: 'expense', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5400' },
  { code: '5420', name: 'Transport Maintenance', type: 'expense', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5400' },
  { code: '5500', name: 'Depreciation',      type: 'expense',   normalBalance: 'debit', isGroup: true,  isSystem: false, parentCode: '5000' },
  { code: '5510', name: 'Depreciation Expense', type: 'expense', normalBalance: 'debit', isGroup: false, isSystem: false, subtype: 'operating_expense', parentCode: '5500' },
];

export async function seedAccounts() {
  // Build code → _id map for parent resolution
  const existingAccounts = await Account.find({}, { code: 1 });
  const existingCodes = new Set(existingAccounts.map(a => a.code));

  // Insert non-group accounts first to resolve parents
  const codeToId = {};
  for (const a of existingAccounts) codeToId[a.code] = a._id;

  for (const def of COA) {
    if (existingCodes.has(def.code)) continue;

    const doc = {
      code:          def.code,
      name:          def.name,
      type:          def.type,
      subtype:       def.subtype || undefined,
      normalBalance: def.normalBalance,
      isGroup:       def.isGroup,
      isSystem:      def.isSystem,
      description:   def.description || '',
      isActive:      true,
      parent:        def.parentCode ? codeToId[def.parentCode] || null : null,
    };

    const created = await Account.create(doc);
    codeToId[def.code] = created._id;
  }

  console.log('✓ Chart of Accounts seeded');
}

// Map category names → revenue account codes
export const CATEGORY_REVENUE_MAP = {
  'Monthly':        '4110',
  'Tuition':        '4110',
  'Admission':      '4120',
  'Exam':           '4130',
  'Library':        '4140',
  'Identity Card':  '4150',
  'Transport':      '4210',
  'Hostel':         '4220',
  'Custom':         '4110',
};

// Map payment method → asset account code
export const METHOD_ACCOUNT_MAP = {
  'Cash':           '1110',
  'Bank Transfer':  '1120',
  'eSewa':          '1140',
  'Khalti':         '1140',
  'FonePay':        '1140',
  'Cheque':         '1120',
};

// Map expense category keywords → expense account code (case-insensitive substring match)
export const EXPENSE_CATEGORY_MAP = [
  { match: ['teacher salary', 'teacher'],       code: '5110' },
  { match: ['staff salary', 'salary'],           code: '5120' },
  { match: ['bonus'],                            code: '5130' },
  { match: ['rent'],                             code: '5210' },
  { match: ['electricity', 'electric'],          code: '5220' },
  { match: ['water'],                            code: '5230' },
  { match: ['internet', 'telephone', 'phone'],   code: '5240' },
  { match: ['stationery', 'supplies'],           code: '5250' },
  { match: ['printing', 'publication'],          code: '5260' },
  { match: ['library'],                          code: '5310' },
  { match: ['lab'],                              code: '5320' },
  { match: ['sports'],                           code: '5330' },
  { match: ['repair', 'maintenance'],            code: '5410' },
  { match: ['transport maintenance'],            code: '5420' },
  { match: ['depreciation'],                     code: '5510' },
];

export function resolveExpenseCode(category = '') {
  const lower = category.toLowerCase();
  for (const { match, code } of EXPENSE_CATEGORY_MAP) {
    if (match.some(m => lower.includes(m))) return code;
  }
  return '5250'; // fallback: Stationery & Supplies
}
