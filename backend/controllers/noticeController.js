import asyncHandler from 'express-async-handler';
import Notice from '../models/Notice.js';
import { notify } from '../utils/notify.js';

export const createNotice = asyncHandler(async (req, res) => {
  const { title, content, audience } = req.body;
  if (!title || !content || !audience) {
    res.status(400); throw new Error('title, content and audience are required');
  }

  const notice = await Notice.create({ title, content, audience, postedBy: req.user._id });

  const audienceLabel = audience === 'both' ? 'all' : audience;
  notify({
    title: `Notice: ${title}`,
    message: content.length > 120 ? content.slice(0, 120) + '...' : content,
    type: 'general',
    audience: audienceLabel,
    createdBy: req.user._id,
  });

  res.status(201).json(notice);
});

export const getNotices = asyncHandler(async (req, res) => {
  const role = req.user.role;
  let q = {};
  if (role === 'teacher') q = { audience: { $in: ['teacher', 'both'] } };
  else if (role === 'student' || role === 'parent') q = { audience: { $in: ['student', 'both'] } };

  const notices = await Notice.find(q)
    .populate('postedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(notices);
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) { res.status(404); throw new Error('Notice not found'); }
  res.json({ message: 'Notice deleted' });
});
