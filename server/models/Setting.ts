import mongoose from 'mongoose';

// Generic key/value settings store — singleton-style documents the admin
// panel can edit without a redeploy. Currently holds `ai-budget` (the AI
// Picks quiz price brackets); future admin-editable config lands here too.
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);
