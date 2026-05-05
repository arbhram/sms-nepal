import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Copy, KeyRound } from 'lucide-react';
import api from '../../api/axios.js';
import PageHeader from '../../components/ui/PageHeader.jsx';

function PasswordModal({ email, password, onClose }) {
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><KeyRound size={20} className="text-blue-600" /></div>
          <h3 className="font-display font-bold text-slate-900 text-lg">Teacher Login Created</h3>
        </div>
        <p className="text-slate-500 text-sm mb-5">Save these credentials — the password cannot be recovered later.</p>
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

export default function TeacherForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState(null);

  const formik = useFormik({
    initialValues: {
      fullName: '', email: '', phone: '', gender: '', subject: '',
      qualification: '', salary: '', address: '',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('Required'),
      phone: Yup.string().required('Required'),
      subject: Yup.string().required('Required'),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          await api.put(`/teachers/${id}`, values);
          toast.success('Teacher updated');
          navigate('/teachers');
        } else {
          const { data } = await api.post('/teachers', values);
          toast.success('Teacher created');
          setCredentials({ email: data.loginEmail, password: data.generatedPassword });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Save failed');
      }
    },
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/teachers/${id}`).then(({ data }) => {
        formik.setValues({
          fullName: data.fullName || '', email: data.email || '', phone: data.phone || '',
          gender: data.gender || '', subject: data.subject || '',
          qualification: data.qualification || '', salary: data.salary || '',
          address: data.address || '',
        });
      });
    }
    // eslint-disable-next-line
  }, [id]);

  return (
    <div>
      {credentials && (
        <PasswordModal
          email={credentials.email}
          password={credentials.password}
          onClose={() => { setCredentials(null); navigate('/teachers'); }}
        />
      )}
      <PageHeader
        title={isEdit ? 'Edit Teacher' : 'New Teacher'}
        action={<Link to="/teachers" className="btn-secondary"><ArrowLeft size={16} /> Back</Link>}
      />
      <form onSubmit={formik.handleSubmit} className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {[
          ['fullName', 'Full Name', 'text', true],
          ['phone', 'Phone', 'text', true],
          ['email', 'Email', 'email'],
          ['subject', 'Subject', 'text', true],
          ['qualification', 'Qualification'],
          ['salary', 'Salary (NPR)', 'number'],
          ['address', 'Address'],
        ].map(([name, label, type = 'text', required]) => (
          <div key={name} className={name === 'address' ? 'md:col-span-2' : ''}>
            <label className="label">{label} {required && <span className="text-rose-500">*</span>}</label>
            <input
              name={name} type={type}
              value={formik.values[name]} onChange={formik.handleChange}
              className="input"
            />
            {formik.errors[name] && <p className="text-xs text-rose-500 mt-1">{formik.errors[name]}</p>}
          </div>
        ))}
        <div>
          <label className="label">Gender</label>
          <select name="gender" value={formik.values.gender} onChange={formik.handleChange} className="input">
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Link to="/teachers" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={formik.isSubmitting}>
            <Save size={16} /> {formik.isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
