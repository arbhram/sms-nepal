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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><KeyRound size={20} className="text-green-600" /></div>
          <h3 className="font-display font-bold text-slate-900 text-lg">Student Login Created</h3>
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
  );
}

const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const formik = useFormik({
    initialValues: {
      fullName: '', gender: 'Male', dateOfBirth: '', bloodGroup: '', nationality: 'Nepali',
      phone: '', email: '', address: '',
      guardianName: '', guardianPhone: '', guardianOccupation: '',
      class: '', section: 'A', rollNumber: '', previousSchool: '',
      citizenshipNumber: '', municipality: '', wardNumber: '', province: '',
      usesTransport: false, transportRoute: '',
      status: 'active',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('Required'),
      gender: Yup.string().required('Required'),
      dateOfBirth: Yup.date().required('Required'),
      guardianName: Yup.string().required('Required'),
      guardianPhone: Yup.string().required('Required'),
      class: Yup.string().required('Required'),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => {
          if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
        });
        if (photo) fd.append('photo', photo);

        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        if (isEdit) {
          await api.put(`/students/${id}`, fd, config);
          toast.success('Student updated');
          navigate('/students');
        } else {
          const { data } = await api.post('/students', fd, config);
          toast.success('Student created');
          setCredentials({ email: data.loginEmail, password: data.generatedPassword });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Save failed');
      }
    },
  });

  useEffect(() => {
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
    if (isEdit) {
      api.get(`/students/${id}`).then(({ data }) => {
        formik.setValues({
          fullName: data.fullName || '',
          gender: data.gender || 'Male',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
          bloodGroup: data.bloodGroup || '',
          nationality: data.nationality || 'Nepali',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          guardianName: data.guardianName || '',
          guardianPhone: data.guardianPhone || '',
          guardianOccupation: data.guardianOccupation || '',
          class: data.class?._id || data.class || '',
          section: data.section || 'A',
          rollNumber: data.rollNumber || '',
          previousSchool: data.previousSchool || '',
          citizenshipNumber: data.citizenshipNumber || '',
          municipality: data.municipality || '',
          wardNumber: data.wardNumber || '',
          province: data.province || '',
          usesTransport: data.usesTransport || false,
          transportRoute: data.transportRoute || '',
          status: data.status || 'active',
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
          onClose={() => { setCredentials(null); navigate('/students'); }}
        />
      )}
      <PageHeader
        title={isEdit ? 'Edit Student' : 'New Student'}
        subtitle={isEdit ? 'Update student information' : 'Fill the form to admit a new student'}
        action={
          <Link to="/students" className="btn-secondary">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <form onSubmit={formik.handleSubmit} className="space-y-5">
        <Section title="Personal Information">
          <Field formik={formik} label="Full Name" name="fullName" required />
          <Field formik={formik} label="Gender" name="gender" options={['Male', 'Female', 'Other']} required />
          <Field formik={formik} label="Date of Birth" name="dateOfBirth" type="date" required />
          <Field formik={formik} label="Blood Group" name="bloodGroup" options={BLOOD} />
          <Field formik={formik} label="Nationality" name="nationality" />
          <div>
            <label className="label">Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="input" />
          </div>
        </Section>

        <Section title="Contact Information">
          <Field formik={formik} label="Phone" name="phone" />
          <Field formik={formik} label="Email" name="email" type="email" />
          <div className="md:col-span-2">
            <Field formik={formik} label="Address" name="address" />
          </div>
          <Field formik={formik} label="Guardian Name" name="guardianName" required />
          <Field formik={formik} label="Guardian Phone" name="guardianPhone" required />
          <Field formik={formik} label="Guardian Occupation" name="guardianOccupation" />
        </Section>

        <Section title="Academic Information">
          <div>
            <label className="label">Class <span className="text-rose-500">*</span></label>
            <select name="class" value={formik.values.class} onChange={formik.handleChange} className="input">
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {formik.errors.class && <p className="text-xs text-rose-500 mt-1">{formik.errors.class}</p>}
          </div>
          <Field formik={formik} label="Section" name="section" />
          <Field formik={formik} label="Roll Number" name="rollNumber" />
          <Field formik={formik} label="Previous School" name="previousSchool" />
        </Section>

        <Section title="Nepal Specific (Government Records)">
          <Field formik={formik} label="Citizenship Number" name="citizenshipNumber" />
          <Field formik={formik} label="Municipality" name="municipality" />
          <Field formik={formik} label="Ward Number" name="wardNumber" />
          <Field formik={formik} label="Province" name="province" options={PROVINCES} />
        </Section>

        <Section title="Transportation">
          <div className="md:col-span-3 flex items-center gap-3">
            <input
              type="checkbox"
              id="usesTransport"
              name="usesTransport"
              checked={formik.values.usesTransport}
              onChange={formik.handleChange}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <label htmlFor="usesTransport" className="label mb-0 cursor-pointer">
              Student uses school transportation
            </label>
          </div>
          {formik.values.usesTransport && (
            <Field formik={formik} label="Route / Area" name="transportRoute" placeholder="e.g. Bhaktapur Ring Road" />
          )}
        </Section>

        <div className="flex justify-end gap-2 pt-4">
          <Link to="/students" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={formik.isSubmitting} className="btn-primary">
            <Save size={16} /> {formik.isSubmitting ? 'Saving...' : 'Save Student'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ formik, label, name, type = 'text', options, required, ...rest }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {options ? (
        <select name={name} value={formik.values[name]} onChange={formik.handleChange} className="input">
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          name={name} type={type}
          value={formik.values[name]} onChange={formik.handleChange}
          className="input" {...rest}
        />
      )}
      {formik.touched[name] && formik.errors[name] && (
        <p className="text-xs text-rose-500 mt-1">{formik.errors[name]}</p>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-6">
      <h3 className="font-display font-bold text-slate-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}
