import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const notify = async ({ title, message, type = 'general', audience = 'all', recipient = null, createdBy = null }) => {
  try {
    await Notification.create({ title, message, type, audience, recipient, createdBy });
  } catch (_) {}
};

export const notifyStudent = async ({ studentId, title, message, type = 'fee', createdBy = null }) => {
  try {
    const user = await User.findOne({ linkedStudent: studentId }, '_id').lean();
    if (user) {
      await Notification.create({ title, message, type, audience: 'student', recipient: user._id, createdBy });
    }
  } catch (_) {}
};

export const notifyTeacher = async ({ teacherId, title, message, type = 'general', createdBy = null }) => {
  try {
    const user = await User.findOne({ linkedTeacher: teacherId }, '_id').lean();
    if (user) {
      await Notification.create({ title, message, type, audience: 'teacher', recipient: user._id, createdBy });
    }
  } catch (_) {}
};
