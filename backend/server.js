import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { tenantPlugin } from './tenant/tenantPlugin.js';

// Must run before any model file is evaluated — mongoose.model() applies registered
// global plugins at call time. Dynamic imports below ensure model files load after
// this line (static imports are hoisted in ESM and would load models too early).
mongoose.plugin(tenantPlugin);

const { default: connectDB } = await import('./config/db.js');
const { default: app }       = await import('./app.js');

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Keep Render free tier awake — ping self every 14 minutes
  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
      fetch(`${process.env.RENDER_EXTERNAL_URL}/`).catch(() => {});
    }, 14 * 60 * 1000);
  }
});
