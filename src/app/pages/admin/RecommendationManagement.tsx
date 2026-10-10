import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Zap, ToggleLeft, ToggleRight, X, Check, ChevronDown, Coins, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { AIRule, AiBudget, DEFAULT_AI_BUDGET } from '../../types';
import { defaultAIRules } from '../../data/aiRules';
import { settingsApi } from '../../api/client';

const ACTION_COLOR: Record<string, string> = {
  boost: 'bg-green-100 text-green-700 border-green-200',
  filter: 'bg-red-100 text-red-700 border-red-200',
  tag: 'bg-blue-100 text-blue-700 border-blue-200',
};

const FIELD_OPTIONS = ['occasion', 'price', 'flowers', 'category', 'popularity', 'inStock', 'month', 'recipient'];
const OPERATOR_OPTIONS = ['equals', 'includes', 'in_range', 'gte', 'lte', 'between', 'color_match', 'recipient_match'];
const ACTION_OPTIONS: AIRule['action']['type'][] = ['boost', 'filter', 'tag'];

const EMPTY_RULE: Omit<AIRule, 'id'> = {
  name: '', description: '', conditions: [{ field: 'occasion', operator: 'includes', value: '' }],
  action: { type: 'boost', value: 10 }, active: true, priority: 99,
};

function RuleForm({
  form, setForm, onSave, onCancel, isAdding,
}: {
  form: Omit<AIRule, 'id'>;
  setForm: React.Dispatch<React.SetStateAction<Omit<AIRule, 'id'>>>;
  onSave: () => void;
  onCancel: () => void;
  isAdding: boolean;
}) {
  const addCondition = () => setForm(f => ({ ...f, conditions: [...f.conditions, { field: 'occasion', operator: 'includes', value: '' }] }));
  const removeCondition = (i: number) => setForm(f => ({ ...f, conditions: f.conditions.filter((_, ci) => ci !== i) }));
  const updateCondition = (i: number, key: string, value: string) =>
    setForm(f => ({ ...f, conditions: f.conditions.map((c, ci) => ci === i ? { ...c, [key]: value } : c) }));

  return (
    <div className="bg-gradient-to-br from-rose-50 to-purple-50 border-2 border-rose-200 rounded-2xl p-5 mt-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">{isAdding ? 'New Rule' : 'Edit Rule'}</h3>
        <button onClick={onCancel}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Rule Name *</label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Occasion Match Boost" className="border-pink-200" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Priority (lower = first)</label>
          <Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} className="border-pink-200" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Description</label>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this rule do?" className="border-pink-200" />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Conditions (ALL must match)</label>
          <button onClick={addCondition} className="text-xs text-rose-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
        <div className="space-y-2">
          {form.conditions.map((cond, i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-pink-100">
              <select value={cond.field} onChange={e => updateCondition(i, 'field', e.target.value)} className="border border-pink-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none">
                {FIELD_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
              <select value={cond.operator} onChange={e => updateCondition(i, 'operator', e.target.value)} className="border border-pink-200 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none">
                {OPERATOR_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              <Input value={cond.value} onChange={e => updateCondition(i, 'value', e.target.value)} placeholder="value" className="border-pink-200 text-xs flex-1 h-8" />
              {form.conditions.length > 1 && <button onClick={() => removeCondition(i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Action Type</label>
          <select value={form.action.type} onChange={e => setForm(f => ({ ...f, action: { ...f.action, type: e.target.value as AIRule['action']['type'] } }))} className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            {ACTION_OPTIONS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Value (e.g. 40 or tag_name)</label>
          <Input value={String(form.action.value)} onChange={e => setForm(f => ({ ...f, action: { ...f.action, value: e.target.value } }))} placeholder="e.g. 40" className="border-pink-200" />
        </div>
      </div>

      {/* Footer — wraps to two rows on phones so Save Changes never overflows the card */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="accent-rose-500 w-4 h-4" />
          <span className="text-sm text-gray-700">Active</span>
        </label>
        <div className="hidden sm:block flex-1" />
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          <Button variant="outline" onClick={onCancel} className="text-gray-600">Cancel</Button>
          <Button onClick={onSave} className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
            <Check className="w-4 h-4 mr-1" /> {isAdding ? 'Add Rule' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Quiz budget brackets — admin-editable, saved server-side so every shopper
 * sees the latest labels instantly (no redeploy). When flower prices rise,
 * bump these numbers and the AI Picks quiz + its scoring bands follow.
 */
function BudgetRangesCard() {
  const [draft, setDraft] = useState<AiBudget>(DEFAULT_AI_BUDGET);
  const [saved, setSaved] = useState<AiBudget>(DEFAULT_AI_BUDGET);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.getAiBudget()
      .then(b => {
        const v: AiBudget = {
          lowMax: Number.isInteger(Number(b?.lowMax)) ? Number(b.lowMax) : DEFAULT_AI_BUDGET.lowMax,
          midMax: Number.isInteger(Number(b?.midMax)) ? Number(b.midMax) : DEFAULT_AI_BUDGET.midMax,
          highMax: Number.isInteger(Number(b?.highMax)) ? Number(b.highMax) : DEFAULT_AI_BUDGET.highMax,
        };
        setDraft(v);
        setSaved(v);
      })
      .catch(() => { /* offline — defaults are already shown */ });
  }, []);

  const set = (key: keyof AiBudget) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = e.target.value === '' ? NaN : Number(e.target.value);
    setDraft(d => ({ ...d, [key]: n }));
  };

  const valid = Number.isInteger(draft.lowMax) && Number.isInteger(draft.midMax) && Number.isInteger(draft.highMax)
    && draft.lowMax >= 1 && draft.lowMax < draft.midMax && draft.midMax < draft.highMax && draft.highMax <= 1_000_000;
  const dirty = draft.lowMax !== saved.lowMax || draft.midMax !== saved.midMax || draft.highMax !== saved.highMax;
  const show = (n: number) => (Number.isInteger(n) && n > 0 ? n : '?');

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const b = await settingsApi.updateAiBudget(draft);
      const v: AiBudget = { lowMax: Number(b.lowMax), midMax: Number(b.midMax), highMax: Number(b.highMax) };
      setDraft(v);
      setSaved(v);
      toast.success('Budget ranges saved — the AI Picks quiz shows the new brackets immediately.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save budget ranges');
    } finally {
      setSaving(false);
    }
  };

  const FIELDS: { key: keyof AiBudget; label: string; hint: string }[] = [
    { key: 'lowMax', label: 'Low option: Under ₱', hint: 'everything below this' },
    { key: 'midMax', label: 'Medium option: up to ₱', hint: `starts at the low bracket` },
    { key: 'highMax', label: 'High option: up to ₱', hint: 'top of the premium band' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Coins className="w-4 h-4 text-purple-500" /> Quiz Budget Ranges
        </h2>
        <span className="text-xs text-gray-400">AI Picks quiz • applies instantly, no redeploy</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        When flower prices go up, update the three budget brackets here — the quiz labels and its price scoring change with them.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="text-sm font-semibold text-gray-700">{f.label}</label>
            <Input
              type="number"
              min={1}
              step={1}
              value={Number.isFinite(draft[f.key]) ? draft[f.key] : ''}
              onChange={set(f.key)}
              className="mt-1.5"
            />
            <p className="text-xs text-gray-400 mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Quiz will show:{' '}
        <span className="font-medium text-gray-600">
          Under ₱{show(draft.lowMax)} · ₱{show(draft.lowMax)} – ₱{show(draft.midMax)} · ₱{show(draft.midMax) === '?' ? '?' : draft.midMax + 1} – ₱{show(draft.highMax)} · No limit
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        {!valid && (
          <p className="text-xs text-red-500">Brackets must be whole numbers that increase: 1 ≤ Under &lt; medium ≤ high (max ₱1,000,000).</p>
        )}
        <div className="ml-auto flex items-center gap-3">
          <Button variant="outline" onClick={() => setDraft(saved)} disabled={saving || !dirty} className="border-gray-200">
            Reset
          </Button>
          <Button
            onClick={save}
            disabled={saving || !valid || !dirty}
            className="bg-gradient-to-r from-rose-500 to-purple-500 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Save Ranges
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RecommendationManagement() {
  const [rules, setRules] = useState<AIRule[]>(defaultAIRules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingAtTop, setAddingAtTop] = useState(false);
  const [form, setForm] = useState<Omit<AIRule, 'id'>>(EMPTY_RULE);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const startAdd = () => { setAddingAtTop(true); setEditingId(null); setForm(EMPTY_RULE); };
  const startEdit = (r: AIRule) => {
    if (editingId === r.id) { setEditingId(null); return; }
    setEditingId(r.id);
    setAddingAtTop(false);
    setForm({ name: r.name, description: r.description, conditions: r.conditions, action: r.action, active: r.active, priority: r.priority });
  };
  const cancel = () => { setAddingAtTop(false); setEditingId(null); };

  const save = () => {
    if (!form.name.trim()) return;
    if (addingAtTop) {
      setRules(prev => [...prev, { ...form, id: `rule-${Date.now()}` }]);
    } else if (editingId) {
      setRules(prev => prev.map(r => r.id === editingId ? { ...form, id: editingId } : r));
    }
    cancel();
  };

  const toggleActive = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const deleteRule = (id: string) => { setRules(prev => prev.filter(r => r.id !== id)); setDeleteId(null); };

  const activeCount = rules.filter(r => r.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Recommendation Rules</h1>
          <p className="text-gray-500 text-sm">{activeCount} active rules • {rules.length} total</p>
        </div>
        <Button onClick={startAdd} className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Rule
        </Button>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-purple-50 to-rose-50 border border-purple-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-purple-800 mb-1">How Rule-Based AI Works</p>
            <p className="text-sm text-purple-700">Each rule evaluates the user's quiz answers (occasion, budget, color, recipient) and awards a score boost to matching bouquets. All active rules run in priority order. The top 4 highest-scoring bouquets are shown as recommendations. <strong>Boost</strong> adds points, <strong>Filter</strong> excludes, <strong>Tag</strong> labels the result.</p>
          </div>
        </div>
      </div>

      {/* Admin-editable quiz budget brackets */}
      <BudgetRangesCard />

      {/* Top-level add form */}
      {addingAtTop && (
        <RuleForm form={form} setForm={setForm} onSave={save} onCancel={cancel} isAdding={true} />
      )}

      {/* Rules list — edit form renders inline below each card */}
      <div className="space-y-2">
        {[...rules].sort((a, b) => a.priority - b.priority).map(rule => (
          <div key={rule.id}>
            <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${rule.active ? 'border-pink-100' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-mono">P{rule.priority}</span>
                    <h3 className="font-bold text-gray-800">{rule.name}</h3>
                    <Badge className={`border text-xs ${ACTION_COLOR[rule.action.type]}`}>
                      {rule.action.type}: {typeof rule.action.value === 'number' ? `+${rule.action.value}` : rule.action.value}
                    </Badge>
                    {!rule.active && <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{rule.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.conditions.map((c, i) => (
                      <span key={i} className="bg-purple-50 text-purple-700 border border-purple-100 rounded-lg px-2 py-0.5 text-xs font-mono">
                        {c.field} {c.operator} "{c.value}"
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(rule.id)} className={`transition-colors ${rule.active ? 'text-green-500 hover:text-gray-400' : 'text-gray-300 hover:text-green-400'}`}>
                    {rule.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => startEdit(rule)}
                    className={`p-1.5 rounded-lg transition-colors ${editingId === rule.id ? 'bg-rose-100 text-rose-600' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {deleteId === rule.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => deleteRule(rule.id)} className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">Delete</button>
                      <button onClick={() => setDeleteId(null)} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(rule.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inline edit form — below this card */}
            {editingId === rule.id && (
              <RuleForm form={form} setForm={setForm} onSave={save} onCancel={cancel} isAdding={false} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
