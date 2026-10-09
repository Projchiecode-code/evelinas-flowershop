import { useEffect, useState } from 'react';
import { Send, Plus, Edit2, Trash2, Clock, Check, X, Loader2, Megaphone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { NotificationTemplate, NotificationLog } from '../../types';
import { notificationApi } from '../../api/client';

const INITIAL_TEMPLATES: NotificationTemplate[] = [
  { id: 't1', name: 'Order Confirmed', trigger: 'order.created', subject: 'Your order has been placed! 🌸', body: 'Hi {{customerName}}, your order #{{orderId}} has been received. Total: {{total}}. We\'ll notify you once payment is verified.', active: true },
  { id: 't2', name: 'Payment Verified', trigger: 'order.to-ship', subject: 'Payment confirmed — preparing your bouquet! 💐', body: 'Hi {{customerName}}, we\'ve verified your payment for order #{{orderId}}. Our florists are now arranging your beautiful bouquet!', active: true },
  { id: 't3', name: 'Out for Delivery', trigger: 'order.to-receive', subject: 'Your bouquet is on its way! 🚚', body: 'Hi {{customerName}}, your order #{{orderId}} has been dispatched and is out for delivery. Estimated arrival: {{estimatedDelivery}}.', active: true },
  { id: 't4', name: 'Delivered — Rate Us', trigger: 'order.to-rate', subject: 'Your flowers have arrived! Leave a review 🌹', body: 'Hi {{customerName}}, we hope you\'re loving your bouquet! Share your experience and help others find their perfect flowers.', active: true },
  { id: 't5', name: 'Order Cancelled', trigger: 'order.cancelled', subject: 'Order Cancellation Confirmation', body: 'Hi {{customerName}}, your order #{{orderId}} has been cancelled. If you paid via e-wallet or bank transfer, a refund will be processed within 3–5 business days.', active: false },
];

const EMPTY_TEMPLATE: Omit<NotificationTemplate, 'id'> = { name: '', trigger: 'order.created', subject: '', body: '', active: true };

function TemplateForm({
  form, setForm, onSave, onCancel, isAdding,
}: {
  form: Omit<NotificationTemplate, 'id'>;
  setForm: React.Dispatch<React.SetStateAction<Omit<NotificationTemplate, 'id'>>>;
  onSave: () => void;
  onCancel: () => void;
  isAdding: boolean;
}) {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-purple-50 border-2 border-rose-200 rounded-2xl p-5 mt-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">{isAdding ? 'New Template' : 'Edit Template'}</h3>
        <button onClick={onCancel}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Template Name</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Order Confirmed" className="border-pink-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Trigger Event</label>
            <select value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
              {['order.created', 'order.to-ship', 'order.to-receive', 'order.to-rate', 'order.cancelled', 'manual'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Subject Line</label>
          <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject..." className="border-pink-200" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
            Body <span className="text-gray-400 font-normal">— sent as written; edit before sending</span>
          </label>
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={3} className="w-full border border-pink-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-rose-400" placeholder="Notification body..." />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="accent-rose-500 w-4 h-4" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="text-gray-600">Cancel</Button>
            <Button onClick={onSave} className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
              <Check className="w-4 h-4 mr-1" /> {isAdding ? 'Add Template' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationManagement() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [activeSection, setActiveSection] = useState<'templates' | 'manual' | 'history'>('templates');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingAtTop, setAddingAtTop] = useState(false);
  const [form, setForm] = useState<Omit<NotificationTemplate, 'id'>>(EMPTY_TEMPLATE);
  const [manualForm, setManualForm] = useState({ subject: '', body: '' });
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Real send history from the API: event-driven notifications (Auto) and
  // admin broadcasts (Manual). This used to be hardcoded mock rows.
  const loadHistory = async () => {
    try {
      const data = await notificationApi.getAll() as any[];
      const rows: NotificationLog[] = (Array.isArray(data) ? data : []).map(n => ({
        id: n._id || n.id || Math.random().toString(36).slice(2),
        subject: n.title,
        recipient: n.user ? 'customer' : 'all_customers',
        sentAt: new Date(n.createdAt || Date.now()),
        status: 'sent',
        type: n.user ? 'auto' : 'manual',
      }));
      setLogs(rows);
    } catch (err) {
      console.error('Failed to load notification history:', err);
      setLogs([]);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const startAdd = () => { setAddingAtTop(true); setEditingId(null); setForm(EMPTY_TEMPLATE); };
  const startEdit = (t: NotificationTemplate) => {
    if (editingId === t.id) { setEditingId(null); return; }
    setEditingId(t.id);
    setAddingAtTop(false);
    setForm({ name: t.name, trigger: t.trigger, subject: t.subject, body: t.body, active: t.active });
  };
  const cancel = () => { setAddingAtTop(false); setEditingId(null); };

  const saveTemplate = () => {
    if (addingAtTop) {
      setTemplates(prev => [...prev, { ...form, id: `t-${Date.now()}` }]);
    } else if (editingId) {
      setTemplates(prev => prev.map(t => t.id === editingId ? { ...form, id: editingId } : t));
    }
    cancel();
  };

  const toggleTemplate = (id: string) => setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  const deleteTemplate = (id: string) => { setTemplates(prev => prev.filter(t => t.id !== id)); setDeleteId(null); };

  /** Load a template's copy into the announcement composer. */
  const useTemplate = (t: NotificationTemplate) => {
    setManualForm({ subject: t.subject, body: t.body });
    setActiveSection('manual');
  };

  // Broadcast to every customer's bell — this used to only fake a success
  // banner without ever calling the API.
  const sendManual = async () => {
    if (!manualForm.subject || !manualForm.body || sending) return;
    setSending(true);
    setSendError('');
    try {
      await notificationApi.create({
        title: manualForm.subject,
        message: manualForm.body,
        type: 'promo',
        broadcast: true,
      });
      setManualForm({ subject: '', body: '' });
      setSendSuccess(true);
      await loadHistory();
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      console.error('Broadcast failed:', err);
      setSendError('Could not send the announcement. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Notification Management</h1>
        <p className="text-gray-500 text-sm">{templates.filter(t => t.active).length} active presets • {logs.length} notifications logged</p>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-800">
          <strong>🔔 How notifications work:</strong> Order events fire automatically — placing an order pushes <em>Order placed 🌸</em> to the customer and <em>New order received 🛍️</em> to the admin bar, and status changes (payment confirmed, out for delivery, delivered, cancelled) push updates to the customer's bell. Templates here are presets for the <strong>Send Announcement</strong> tab, which broadcasts to every customer. Notifications are in-app only — no emails are sent.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 border-b border-pink-100">
        {([['templates', 'Message Presets'], ['manual', 'Send Announcement'], ['history', 'Send History']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveSection(key)} className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-colors ${activeSection === key ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Templates */}
      {activeSection === 'templates' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={startAdd} className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
              <Plus className="w-4 h-4 mr-2" /> New Template
            </Button>
          </div>

          {addingAtTop && (
            <TemplateForm form={form} setForm={setForm} onSave={saveTemplate} onCancel={cancel} isAdding={true} />
          )}

          {templates.map(t => (
            <div key={t.id}>
              <div className={`bg-white rounded-2xl border shadow-sm p-5 ${t.active ? 'border-pink-100' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-800">{t.name}</h3>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-mono">{t.trigger}</Badge>
                      {t.active
                        ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>
                        : <Badge className="bg-gray-100 text-gray-500 text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">📧 {t.subject}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{t.body}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => useTemplate(t)} title="Use in announcement" className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-50 hover:text-purple-600">
                      <Send className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleTemplate(t.id)} className={`p-1.5 rounded-lg transition-colors ${t.active ? 'text-green-500 hover:text-gray-400' : 'text-gray-300 hover:text-green-500'}`}>
                      {t.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(t)} className={`p-1.5 rounded-lg transition-colors ${editingId === t.id ? 'bg-rose-100 text-rose-600' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'}`}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {deleteId === t.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteTemplate(t.id)} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">Del</button>
                        <button onClick={() => setDeleteId(null)} className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline edit form — below clicked card */}
              {editingId === t.id && (
                <TemplateForm form={form} setForm={setForm} onSave={saveTemplate} onCancel={cancel} isAdding={false} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual Send */}
      {activeSection === 'manual' && (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-6 max-w-2xl">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2"><Megaphone className="w-4 h-4 text-purple-500" /> Compose Announcement</h3>
          {sendSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> Announcement sent to every customer's bell!
            </div>
          )}
          {sendError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
              <X className="w-4 h-4" /> {sendError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Audience</label>
              <div className="w-full border border-pink-100 bg-rose-50/50 rounded-xl px-3 py-2.5 text-sm text-gray-600 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-500" /> All customers — lands in every signed-in shopper's bell
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Subject</label>
              <Input value={manualForm.subject} onChange={e => setManualForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Weekend special: 20% off all bouquets!" className="border-pink-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Message</label>
              <textarea value={manualForm.body} onChange={e => setManualForm(f => ({ ...f, body: e.target.value }))} rows={5} className="w-full border border-pink-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-rose-400" placeholder="Type your message here..." />
            </div>
            <Button
              onClick={sendManual}
              disabled={sending || !manualForm.subject || !manualForm.body}
              className="bg-gradient-to-r from-rose-500 to-purple-500 text-white w-full"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? 'Sending…' : 'Send Announcement'}
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {activeSection === 'history' && (
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-rose-50 border-b border-rose-100">
                <tr>
                  <th className="text-left p-4 text-gray-600 font-semibold">Subject</th>
                  <th className="text-left p-4 text-gray-600 font-semibold hidden md:table-cell">Recipient</th>
                  <th className="text-left p-4 text-gray-600 font-semibold hidden sm:table-cell">Sent At</th>
                  <th className="text-center p-4 text-gray-600 font-semibold">Type</th>
                  <th className="text-center p-4 text-gray-600 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-rose-50 hover:bg-rose-50/30 transition-colors">
                    <td className="p-4"><p className="font-medium text-gray-800 text-sm">{log.subject}</p></td>
                    <td className="p-4 hidden md:table-cell text-gray-600 text-sm">{log.recipient}</td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-gray-500 text-xs"><Clock className="w-3 h-3" /> {log.sentAt.toLocaleString()}</div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={log.type === 'auto' ? 'bg-blue-100 text-blue-700 border-blue-200 text-xs' : 'bg-purple-100 text-purple-700 border-purple-200 text-xs'}>
                        {log.type === 'auto' ? 'Auto' : 'Manual'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={log.status === 'sent' ? 'bg-green-100 text-green-700 border-green-200 text-xs' : 'bg-red-100 text-red-700 border-red-200 text-xs'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
