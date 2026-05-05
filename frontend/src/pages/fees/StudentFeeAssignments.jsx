import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/axios.js';
import { Loader } from '../../components/ui/Misc.jsx';
import { currentAcademicYear, academicYearOptions } from '../../utils/nepaliDate.js';

const ADJ_TYPES = [
  { value: 'discount_fixed',      label: 'Discount (Fixed Rs.)' },
  { value: 'discount_percent',    label: 'Discount (%)' },
  { value: 'scholarship_fixed',   label: 'Scholarship (Fixed Rs.)' },
  { value: 'scholarship_percent', label: 'Scholarship (%)' },
  { value: 'surcharge_fixed',     label: 'Surcharge (Fixed Rs.)' },
];

const ADJ_COLOR = {
  discount_fixed:      'bg-emerald-100 text-emerald-700',
  discount_percent:    'bg-emerald-100 text-emerald-700',
  scholarship_fixed:   'bg-blue-100   text-blue-700',
  scholarship_percent: 'bg-blue-100   text-blue-700',
  surcharge_fixed:     'bg-rose-100   text-rose-700',
};

function emptyAdjustment() {
  return { label: '', type: 'discount_fixed', value: '', scope: 'total', componentName: '', reason: '' };
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function AssignmentModal({ assignment, onClose, onSaved }) {
  const [components,  setComponents]  = useState(
    (assignment.components || []).map((c) => ({
      ...c,
      overrideAmount: c.overrideAmount !== null && c.overrideAmount !== undefined ? String(c.overrideAmount) : '',
    })),
  );
  const [adjustments, setAdjustments] = useState(
    (assignment.adjustments || []).map((a) => ({ ...a, value: String(a.value) })),
  );
  const [tab,    setTab]    = useState('components');
  const [saving, setSaving] = useState(false);

  const updateComp = (idx, field, value) =>
    setComponents((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  const addAdj    = () => setAdjustments((prev) => [...prev, emptyAdjustment()]);
  const removeAdj = (idx) => setAdjustments((prev) => prev.filter((_, i) => i !== idx));
  const updateAdj = (idx, field, value) =>
    setAdjustments((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));

  const save = async () => {
    for (const a of adjustments) {
      if (!a.label.trim()) { toast.error('Each adjustment needs a label'); return; }
      if (a.value === '' || isNaN(Number(a.value)) || Number(a.value) < 0) {
        toast.error(`"${a.label}": invalid value`); return;
      }
      if (a.scope === 'component' && !a.componentName) {
        toast.error(`"${a.label}": select a component`); return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        components: components.map((c) => ({
          ...c,
          overrideAmount: c.overrideAmount !== '' ? Number(c.overrideAmount) : null,
        })),
        adjustments: adjustments.map((a) => ({ ...a, value: Number(a.value) })),
      };
      const { data } = await api.put(`/fee-structures/assignments/${assignment._id}`, payload);
      toast.success('Assignment updated');
      onSaved(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const summary = assignment.summary || {};
  const compNames = components.map((c) => c.name);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-8">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h3 className="font-display font-bold text-slate-900">{assignment.student?.fullName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{assignment.student?.studentId} · {assignment.class?.name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {[['components', 'Components'], ['adjustments', 'Discounts & Adjustments']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'components' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 mb-4">
                  Toggle components on/off for this student. Override amount overrides the base amount only for this student.
                </p>
                {components.map((c, idx) => (
                  <div key={idx} className={`rounded-xl border p-3 transition-colors ${c.isIncluded ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={c.isIncluded}
                        onChange={(e) => updateComp(idx, 'isIncluded', e.target.checked)}
                        className="mt-1 w-4 h-4 accent-brand-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-medium text-sm text-slate-800">{c.name}</p>
                          <span className="text-xs text-slate-400 capitalize">{c.frequency}</span>
                          {c.isOptional && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Optional</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[10px] text-slate-400 mb-1">Base amount</p>
                            <p className="text-sm font-semibold text-slate-700">Rs. {c.baseAmount?.toLocaleString()}</p>
                          </div>
                          <div className="text-slate-300">→</div>
                          <div>
                            <p className="text-[10px] text-slate-400 mb-1">Override amount (leave blank to use base)</p>
                            <input
                              type="number"
                              min="0"
                              value={c.overrideAmount}
                              onChange={(e) => updateComp(idx, 'overrideAmount', e.target.value)}
                              disabled={!c.isIncluded}
                              className="input py-1 text-sm w-32"
                              placeholder={String(c.baseAmount)}
                            />
                          </div>
                          {c.overrideAmount !== '' && (
                            <div>
                              <p className="text-[10px] text-slate-400 mb-1">Override reason</p>
                              <input
                                value={c.overrideReason || ''}
                                onChange={(e) => updateComp(idx, 'overrideReason', e.target.value)}
                                className="input py-1 text-sm w-36"
                                placeholder="e.g. Special case"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'adjustments' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400">Add discounts, scholarships, or surcharges for this student.</p>
                  <button onClick={addAdj} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                    <Plus size={13} /> Add
                  </button>
                </div>

                {adjustments.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-sm">
                    No adjustments yet
                  </div>
                )}

                {adjustments.map((a, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="label text-[10px]">Label</label>
                        <input
                          value={a.label}
                          onChange={(e) => updateAdj(idx, 'label', e.target.value)}
                          className="input py-1.5 text-sm"
                          placeholder="e.g. Sibling Discount"
                        />
                      </div>
                      <button onClick={() => removeAdj(idx)} className="mt-5 p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-[150px]">
                        <label className="label text-[10px]">Type</label>
                        <select value={a.type} onChange={(e) => updateAdj(idx, 'type', e.target.value)} className="input py-1.5 text-sm">
                          {ADJ_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="label text-[10px]">Value</label>
                        <input
                          type="number"
                          min="0"
                          value={a.value}
                          onChange={(e) => updateAdj(idx, 'value', e.target.value)}
                          className="input py-1.5 text-sm"
                          placeholder={a.type.endsWith('_percent') ? '10' : '500'}
                        />
                      </div>
                      <div className="w-32">
                        <label className="label text-[10px]">Applies to</label>
                        <select value={a.scope} onChange={(e) => updateAdj(idx, 'scope', e.target.value)} className="input py-1.5 text-sm">
                          <option value="total">Total</option>
                          <option value="component">Specific component</option>
                        </select>
                      </div>
                      {a.scope === 'component' && (
                        <div className="flex-1 min-w-[140px]">
                          <label className="label text-[10px]">Component</label>
                          <select value={a.componentName} onChange={(e) => updateAdj(idx, 'componentName', e.target.value)} className="input py-1.5 text-sm">
                            <option value="">Select…</option>
                            {compNames.map((n) => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="label text-[10px]">Reason (optional)</label>
                      <input
                        value={a.reason}
                        onChange={(e) => updateAdj(idx, 'reason', e.target.value)}
                        className="input py-1.5 text-sm"
                        placeholder="e.g. Merit scholarship 2025"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary bar */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-400">Monthly</p>
              <p className="font-bold text-slate-900">Rs. {(summary.monthlyNet || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Annual total</p>
              <p className="font-bold text-slate-900">Rs. {(summary.totalAnnualNet || 0).toLocaleString()}</p>
            </div>
            {(summary.totalDiscounts || 0) > 0 && (
              <div>
                <p className="text-xs text-slate-400">Total discounts</p>
                <p className="font-bold text-emerald-600">– Rs. {summary.totalDiscounts.toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentFeeAssignments() {
  const [classes,      setClasses]      = useState([]);
  const [classId,      setClassId]      = useState('');
  const [academicYear, setAcademicYear]  = useState(currentAcademicYear());
  const [assignments,  setAssignments]  = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [expanded,     setExpanded]     = useState({});

  useEffect(() => {
    api.get('/classes').then(({ data }) => setClasses(data)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/fee-structures/assignments', {
        params: { classId, academicYear },
      });
      setAssignments(data);
    } catch {
      toast.error('Failed to load assignments');
    } finally { setLoading(false); }
  }, [classId, academicYear]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (updated) => {
    setAssignments((prev) => prev.map((a) => a._id === updated._id ? updated : a));
    setEditTarget(null);
  };

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const adjTypeLabel = (type) => ADJ_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Student Fee Assignments</h1>
        <p className="text-slate-500 text-sm mt-0.5">View and customise each student's fee — add discounts, scholarships, or component overrides</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="label">Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input">
            <option value="">Select class…</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div className="w-44">
          <label className="label">Academic Year (B.S.)</label>
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="input">
            {academicYearOptions(2, 1).map((y) => (
              <option key={y} value={y}>B.S. {y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loader />}

      {!loading && classId && assignments.length === 0 && (
        <div className="card p-12 text-center text-slate-400">
          <Users size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No fee assignments found for this class/year.</p>
          <p className="text-xs mt-1">Go to <strong>Fee Structures</strong> and click "Apply to Students" first.</p>
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monthly</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Annual Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Discounts</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Adjustments</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => {
                  const s = a.summary || {};
                  const isExp = expanded[a._id];
                  return (
                    <>
                      <tr key={a._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{a.student?.fullName}</p>
                          <p className="text-xs text-slate-400">{a.student?.studentId}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          Rs. {(s.monthlyNet || 0).toLocaleString()}
                          {s.monthlyGross !== s.monthlyNet && (
                            <span className="text-xs text-slate-400 line-through ml-1">Rs. {(s.monthlyGross || 0).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          Rs. {(s.totalAnnualNet || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(s.totalDiscounts || 0) > 0
                            ? <span className="text-emerald-600 font-medium">– Rs. {s.totalDiscounts.toLocaleString()}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.adjustments?.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {a.adjustments.map((adj, i) => (
                                <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ADJ_COLOR[adj.type] || 'bg-slate-100 text-slate-600'}`}>
                                  {adj.label}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => toggleExpand(a._id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                              title="Show breakdown"
                            >
                              {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button
                              onClick={() => setEditTarget(a)}
                              className="text-xs font-medium px-2.5 py-1 rounded-lg text-brand-700 bg-brand-50 hover:bg-brand-100"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable breakdown */}
                      {isExp && (
                        <tr key={`${a._id}-exp`} className="bg-slate-50/50">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="font-semibold text-slate-600 mb-2">Components</p>
                                <div className="space-y-1">
                                  {(a.components || []).map((c, i) => (
                                    <div key={i} className={`flex justify-between ${!c.isIncluded ? 'opacity-40 line-through' : ''}`}>
                                      <span className="text-slate-600">{c.name} <span className="text-slate-400">({c.frequency})</span></span>
                                      <span className="font-medium text-slate-700">
                                        Rs. {(c.overrideAmount !== null && c.overrideAmount !== undefined ? c.overrideAmount : c.baseAmount)?.toLocaleString()}
                                        {c.overrideAmount !== null && c.overrideAmount !== undefined && (
                                          <span className="text-slate-400 line-through ml-1">Rs. {c.baseAmount?.toLocaleString()}</span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {(a.adjustments || []).length > 0 && (
                                <div>
                                  <p className="font-semibold text-slate-600 mb-2">Adjustments</p>
                                  <div className="space-y-1">
                                    {a.adjustments.map((adj, i) => (
                                      <div key={i} className="flex justify-between">
                                        <span className="text-slate-600">{adj.label} <span className="text-slate-400">({adjTypeLabel(adj.type)})</span></span>
                                        <span className={adj.type === 'surcharge_fixed' ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
                                          {adj.type === 'surcharge_fixed' ? '+' : '–'}
                                          {adj.type.endsWith('_percent') ? `${adj.value}%` : `Rs. ${adj.value?.toLocaleString()}`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editTarget && (
        <AssignmentModal
          assignment={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
