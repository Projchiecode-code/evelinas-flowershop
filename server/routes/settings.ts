import { Router } from 'express';
import Setting from '../models/Setting';
import { errorResponse } from '../utils/httpError';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Default brackets for the AI Picks budget question. The client mirrors these
// in DEFAULT_AI_BUDGET (src/app/types.ts) — keep both at 75 / 99 / 120.
const DEFAULT_AI_BUDGET = { lowMax: 75, midMax: 99, highMax: 120 };

const readAiBudget = async () => {
  const doc = await Setting.findOne({ key: 'ai-budget' }).lean() as any;
  const v = doc?.value;
  if (!v || !Number.isFinite(v.lowMax) || !Number.isFinite(v.midMax) || !Number.isFinite(v.highMax)) {
    return { ...DEFAULT_AI_BUDGET };
  }
  return { lowMax: v.lowMax, midMax: v.midMax, highMax: v.highMax };
};

// Public: the quiz renders its budget options from these brackets, so every
// shopper sees whatever the admin last saved (no login needed).
router.get('/ai-budget', async (_req, res) => {
  try {
    res.json(await readAiBudget());
  } catch (err) {
    errorResponse(res, 500, err);
  }
});

// Admin: update the brackets. Must stay strictly ordered so the three quiz
// bands never overlap: Under X / X–Y / (Y+1)–Z.
router.patch('/ai-budget', authenticate, requireAdmin, async (req, res) => {
  try {
    const { lowMax, midMax, highMax } = req.body ?? {};
    const nums = [lowMax, midMax, highMax].map(Number);
    if (nums.some(n => !Number.isInteger(n))) {
      return res.status(400).json({ error: 'Budget brackets must be whole numbers' });
    }
    const [low, mid, high] = nums;
    if (low < 1 || mid < 2 || high < 3 || high > 1_000_000) {
      return res.status(400).json({ error: 'Budget brackets must be between ₱1 and ₱1,000,000' });
    }
    if (!(low < mid && mid < high)) {
      return res.status(400).json({ error: 'Brackets must increase: Under X, then X–Y, then (Y+1)–Z' });
    }
    const value = { lowMax: low, midMax: mid, highMax: high };
    await Setting.updateOne({ key: 'ai-budget' }, { $set: { value } }, { upsert: true });
    res.json(value);
  } catch (err) {
    errorResponse(res, 500, err);
  }
});

export default router;
