import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit2, Trash2, Users, Download, KeyRound, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loader, EmptyState, Badge } from '../../components/ui/Misc.jsx';

const PAGE_LIMIT = 20;

function PasswordModal({ email, password, onClose }) {
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><KeyRound size={20} className="text-green-600" /></div>
            <h3 className="font-display font-bold text-slate-900 text-lg">Student Password</h3>
          </div>
          <p className="text-slate-500 text-sm mb-5">Share these credentials with the student.</p>
          {[['Email / Login', email], ['Password', password]].map(([label, val]) => (
            <div key={label} className="mb-3">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-3 py-2">
                <span className="flex-1 font-mono text-sm text-slate-800">{val}</span>
                <button onClick={() => copy(val)} className="text-slate-400 hover:text-slate-700"><Copy size={14} /></button>
              </div>
            </div>
          ))}
          <button onClick={onClose} className="btn-primary w-full mt-4">Done</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', class: '', status: '' });
  const [credentials, setCredentials] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_LIMIT };
      Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
      const { data } = await api.get('/students', { params });
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setCurrentPage(page);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(1), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [filters]);

  const handleResetPassword = async (id) => {
    try {
      const { data } = await api.post(`/students/${id}/reset-password`);
      setCredentials({ email: data.loginEmail, password: data.password });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      fetchStudents(currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      {credentials && (
        <PasswordModal
          email={credentials.email}
          password={credentials.password}
          onClose={() => setCredentials(null)}
        />
      )}
      <PageHeader
        title="Students"
        subtitle={`${total} student${total !== 1 ? 's' : ''} in your institute`}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary">
              <Download size={16} /> Export
            </button>
            <Link to="/students/new" className="btn-primary">
              <Plus size={16} /> Add Student
            </Link>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="input pl-10"
              placeholder="Search by name, ID or phone..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="input"
            value={filters.class}
            onChange={(e) => setFilters({ ...filters, class: e.target.value })}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <Loader />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            subtitle="Try adjusting filters, or add your first student to get started."
            icon={Users}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Class</th>
                    <th className="px-5 py-3">Guardian</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-brand text-white flex items-center justify-center font-semibold text-sm">
                            {s.fullName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{s.fullName}</div>
                            <div className="text-xs text-slate-500">{s.gender} · Roll {s.rollNumber || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.studentId}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">
                        {s.class?.name || '—'} {s.section && <span className="text-slate-400">· {s.section}</span>}
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <div className="text-slate-700">{s.guardianName}</div>
                        <div className="text-xs text-slate-500">{s.guardianPhone}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={s.status === 'active' ? 'green' : s.status === 'inactive' ? 'red' : 'yellow'}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/students/${s._id}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View">
                            <Eye size={15} />
                          </Link>
                          <Link to={`/students/${s._id}/edit`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Edit">
                            <Edit2 size={15} />
                          </Link>
                          <button
                            onClick={() => handleResetPassword(s._id)}
                            className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                            title="Reset Password"
                          >
                            <KeyRound size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id, s.fullName)}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
                <span>
                  Showing {(currentPage - 1) * PAGE_LIMIT + 1}–{Math.min(currentPage * PAGE_LIMIT, total)} of {total} students
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchStudents(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1 bg-slate-100 rounded-lg font-semibold text-slate-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => fetchStudents(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
