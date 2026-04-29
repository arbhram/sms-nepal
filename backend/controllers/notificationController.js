import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

export const createNotification = asyncHandler(async (req, res) => {
  const n = await Notification.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(n);
});

export const getNotifications = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const list = await Notification.find({
    $or: [
      { recipient: _id },
      { recipient: null, audience: { $in: ['all', role] } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(list);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  const count = await Notification.countDocuments({
    $or: [
      { recipient: _id },
      { recipient: null, audience: { $in: ['all', role] } },
    ],
    readBy: { $ne: _id },
  });
  res.json({ count });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } });
  res.json({ message: 'Marked as read' });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;
  await Notification.updateMany(
    {
      $or: [
        { recipient: _id },
        { recipient: null, audience: { $in: ['all', role] } },
      ],
      readBy: { $ne: _id },
    },
    { $addToSet: { readBy: _id } }
  );
  res.json({ message: 'All marked as read' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: 'Notification removed' });
});
