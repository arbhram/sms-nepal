import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Users, ChevronRight, LayoutList } from 'lucide-react';
import api from '../../api/axios.js';
import { Loader } from '../../components/ui/Misc.jsx';
import { currentAcademicYear, academicYearOptions, formatAcademicYear } from '../../utils/nepaliDate.js';

const FREQUENCIES   = ['monthly', 'termly', 'yearly', 'one-time'];
const CATEGORIES    = ['Monthly', 'Admission', 'Exam', 'Transport', 'Hostel', 'Library', 'Identity Card', 'Custom'];
const FREQ_LABEL    = { monthly: 'Monthly', termly: 'Per Term', yearly: 'Yearly', 'one-time': 'One-time' };

function emptyComponent() {
  return { name: '', amount: '', frequency: 'monthly', category: 'Monthly', isOptional: false, description: '' };
}

export default function FeeStructures() {
  const [classes,      setClasses]      = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [academicYear, setAcademicYear]  = useState(currentAcademicYear());
  const [structure,    setStructure]     = useState(null);
  const [components,   setComponents]   = useState([]);
  const [structureName, setStructureName] = useState('');
  const [loading,      setLoading]       = useState(false);
  const [saving,       setSaving]        = useState(false);
  const [applying,     setApplying]      = useState(false);

  useEffect(() => {
    api.get('/classes').then(({ data }) => setClasses(data)).catch(() => toast.error('Failed to load classes'));
  }, []);

  const loadStructure = useCallback(async (cls, year) => {
    setLoading(true);
    setStructure(null);
    setComponents([]);
    setStructureName('');
    try {
      const { data } = await api.get(`/fee-structures/class/${cls._id}`, { params: { academicYear: year } });
      setStructure(data);
      setComponents(data.components.map((c) => ({ ...c, amount: String(c.amount) })));
      setStructureName(data.name || '');
    } catch (err) {
      if (err.response?.status === 404) {
        setStructure(null);
      } else {
        toast.error('Failed to load structure');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClass) loadStructure(selectedClass, academicYear);
  }, [selectedClass, academicYear, loadStructure]);

  const addComponent = () => setComponents((prev) => [...prev, emptyComponent()]);

  const updateComponent = (idx, field, value) =>
    setComponents((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  const removeComponent = (idx) =>
    setComponents((prev) => prev.filter((_, i) => i !== idx));

  const saveStructure = async () => {
    if (!selectedClass) return;
    for (const c of components) {
      if (!c.name.trim()) { toast.error('All components must have a name'); return; }
      if (c.amount === '' || isNaN(Number(c.amount)) || Number(c.amount) < 0) {
        toast.error(`"${c.name}": invalid amount`); return;
      }
    }
    setSaving(true);
    try {
      const { data } = await api.post('/fee-structures/upsert', {
        classId: selectedClass._id,
        academicYear,
        name: structureName,
        components: components.map((c) => ({ ...c, amount: Number(c.amount) })),
      });
      setStructure(data);
      toast.success('Fee structure saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const applyToStudents = async (overwrite = false) => {
    if (!structure) { toast.error('Save the structure first'); return; }
    setApplying(true);
    try {
      const { data } = await api.post(
        `/fee-structures/${structure._id}/apply`,
        {},
        { params: { overwrite } },
      );
      toast.success(`Done — created: ${data.created}, updated: ${data.updated}, skipped: ${data.skipped}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally { setApplying(false); }
  };

  // Monthly equivalent for display
  const monthlyTotal = components
    .filter((c) => c.frequency === 'monthly' && c.amount !== '')
    .reduce((s, c) => s + Number(c.amount), 0);
  const annualOther = components
    .filter((c) => c.frequency !== 'monthly' && c.amount !== '')
    .reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="flex gap-5 h-full">
      {/* Class list */}
      <div className="w-64 flex-shrink-0">
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {classes.length === 0 && <p className="px-4 py-6 text-sm text-slate-400 text-center">No classes found</p>}
            {classes.map((cls) => (
              <button
                key={cls._id}
                onClick={() => setSelectedClass(cls)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors text-sm ${
                  selectedClass?._id === cls._id
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{cls.name}</span>
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        {!selectedClass ? (
          <div className="card p-16 text-center text-slate-400">
            <LayoutList size={36} className="mx-auto mb-3 text-slate-200" />
            <p className="font-medium">Select a class to manage its fee structure</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">{selectedClass.name}</h2>
                <p className="text-sm text-slate-500">Fee structure template — copied to each student on assignment</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="input text-sm py-1.5"
                >
                  {academicYearOptions(2, 1).map((y) => (
                    <option key={y} value={y}>{formatAcademicYear(y)}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? <Loader /> : (
              <>
                {/* Structure name */}
                <div className="card p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <label className="label">Structure Label (optional)</label>
                    <input
                      value={structureName}
                      onChange={(e) => setStructureName(e.target.value)}
                      className="input"
                      placeholder={`e.g. ${selectedClass.name} Fee Structure ${academicYear}`}
                    />
                  </div>
                </div>

                {/* Components table */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="font-semibold text-slate-800 text-sm">Fee Components</p>
                    <button onClick={addComponent} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                      <Plus size={14} /> Add Component
                    </button>
                  </div>

                  {components.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      No components yet. Click "Add Component" to start.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Name</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Amount (Rs.)</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Frequency</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Category</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Optional</th>
                            <th className="px-3 py-2.5 w-8" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {components.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2">
                                <input
                                  value={c.name}
                                  onChange={(e) => updateComponent(idx, 'name', e.target.value)}
                                  className="input py-1.5 text-sm"
                                  placeholder="e.g. Tuition Fee"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={c.amount}
                                  onChange={(e) => updateComponent(idx, 'amount', e.target.value)}
                                  className="input py-1.5 text-sm w-28"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={c.frequency}
                                  onChange={(e) => updateComponent(idx, 'frequency', e.target.value)}
                                  className="input py-1.5 text-sm"
                                >
                                  {FREQUENCIES.map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={c.category}
                                  onChange={(e) => updateComponent(idx, 'category', e.target.value)}
                                  className="input py-1.5 text-sm"
                                >
                                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={c.isOptional}
                                  onChange={(e) => updateComponent(idx, 'isOptional', e.target.checked)}
                                  className="w-4 h-4 accent-brand-600"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button onClick={() => removeComponent(idx)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Summary footer */}
                  {components.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-6 text-sm">
                      <span className="text-slate-500">Monthly charge:</span>
                      <span className="font-bold text-slate-800">Rs. {monthlyTotal.toLocaleString()}</span>
                      {annualOther > 0 && <>
                        <span className="text-slate-500">+ Annual/one-time:</span>
                        <span className="font-bold text-slate-800">Rs. {annualOther.toLocaleString()}</span>
                      </>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveStructure}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={15} /> {saving ? 'Saving…' : 'Save Structure'}
                  </button>

                  {structure && (
                    <>
                      <button
                        onClick={() => applyToStudents(false)}
                        disabled={applying}
                        className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                      >
                        <Users size={15} /> {applying ? 'Applying…' : 'Apply to New Students'}
                      </button>
                      <button
                        onClick={() => applyToStudents(true)}
                        disabled={applying}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium px-3 py-2 rounded-lg hover:bg-amber-50 transition disabled:opacity-50"
                      >
                        Apply & Overwrite All
                      </button>
                    </>
                  )}
                </div>

                {structure && (
                  <p className="text-xs text-slate-400">
                    "Apply to New Students" skips students who already have a fee assignment. "Apply & Overwrite All" resets everyone's components to this template (existing adjustments/discounts are cleared).
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
