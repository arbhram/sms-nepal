import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { Loader } from '../../components/ui/Misc.jsx';
import ReportCardView from '../../components/ReportCardView.jsx';

export default function StudentReportCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (examId) => {
    setLoading(true);
    try {
      const studentId = JSON.parse(localStorage.getItem('user') || '{}').linkedStudent;
      if (!studentId) throw new Error('Student not found');
      const params = examId ? { examId } : {};
      const { data: d } = await api.get(`/report-cards/student/${studentId}`, { params });
      setData(d);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report card');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-bold text-slate-900">My Report Card</h2>
        <p className="text-slate-500 text-sm mt-0.5">Your exam results and performance</p>
      </div>

      {loading ? <Loader /> : data ? (
        <ReportCardView {...data} onExamChange={load} />
      ) : null}
    </div>
  );
}
