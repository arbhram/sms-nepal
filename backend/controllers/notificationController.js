import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

export const createNotification = asyncHandler(async (req, res) => {
  const n = await Notification.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(n);
});

export const getNotifications = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const q = { $or: [{ audience: 'all' }, { audience: role }] };
  const list = await Notification.find(q).sort({ createdAt: -1 }).limit(50);
  res.json(list);
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } });
  res.json({ message: 'Marked as read' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: 'Notification removed' });
});
