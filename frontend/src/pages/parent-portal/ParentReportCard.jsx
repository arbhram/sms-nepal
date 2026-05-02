import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { Loader } from '../../components/ui/Misc.jsx';
import ReportCardView from '../../components/ReportCardView.jsx';

export default function ParentReportCard() {
  const { activeChild } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (studentId, examId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const params = examId ? { examId } : {};
      const { data: d } = await api.get(`/report-cards/student/${studentId}`, { params });
      setData(d);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report card');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    setData(null);
    if (activeChild?._id) load(activeChild._id);
  }, [activeChild?._id]);

  if (!activeChild) {
    return (
      <div className="card p-12 text-center text-slate-400 text-sm">
        No child selected. Please select a child from the sidebar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-bold text-slate-900">Report Card</h2>
        <p className="text-slate-500 text-sm mt-0.5">{activeChild.fullName}</p>
      </div>

      {loading ? <Loader /> : data ? (
        <ReportCardView
          {...data}
          onExamChange={(examId) => load(activeChild._id, examId)}
        />
      ) : null}
    </div>
  );
}
