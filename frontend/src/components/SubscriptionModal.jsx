import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createSubscription, updateSubscription } from '../api/client';

export default function SubscriptionModal({ isOpen, onClose, initialData, categories, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    description: '',
    category_id: '',
    cost_per_cycle: '',
    billing_cycle: 'monthly',
    currency: 'USD',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    next_renewal_date: '',
    owner: '',
    license_count: '',
    used_licenses: '',
    payment_method: 'credit_card',
    notes: '',
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        vendor: initialData.vendor || '',
        description: initialData.description || '',
        category_id: initialData.category_id || '',
        cost_per_cycle: initialData.cost_per_cycle || '',
        billing_cycle: initialData.billing_cycle || 'monthly',
        currency: initialData.currency || 'USD',
        status: initialData.status || 'active',
        start_date: initialData.start_date || new Date().toISOString().split('T')[0],
        next_renewal_date: initialData.next_renewal_date || '',
        owner: initialData.owner || '',
        license_count: initialData.license_count !== null && initialData.license_count !== undefined ? initialData.license_count : '',
        used_licenses: initialData.used_licenses !== null && initialData.used_licenses !== undefined ? initialData.used_licenses : '',
        payment_method: initialData.payment_method || 'credit_card',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        vendor: '',
        description: '',
        category_id: categories[0]?.id || '',
        cost_per_cycle: '',
        billing_cycle: 'monthly',
        currency: 'USD',
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        next_renewal_date: '',
        owner: '',
        license_count: '',
        used_licenses: '',
        payment_method: 'credit_card',
        notes: '',
      });
    }
    setError('');
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    const cost = parseFloat(formData.cost_per_cycle);
    if (isNaN(cost) || cost <= 0) {
      setError('Cost per cycle must be greater than 0.');
      return;
    }

    const licTotal = formData.license_count === '' ? null : parseInt(formData.license_count, 10);
    const licUsed = formData.used_licenses === '' ? null : parseInt(formData.used_licenses, 10);

    if (licTotal !== null && licUsed !== null && licUsed > licTotal) {
      setError(`Used licenses (${licUsed}) cannot exceed total licenses (${licTotal}).`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        vendor: formData.vendor,
        description: formData.description || null,
        category_id: formData.category_id || null,
        cost_per_cycle: cost,
        billing_cycle: formData.billing_cycle,
        currency: formData.currency,
        status: formData.status,
        start_date: formData.start_date,
        next_renewal_date: formData.next_renewal_date || null,
        owner: formData.owner,
        license_count: licTotal,
        used_licenses: licUsed,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
      };

      if (initialData?.id) {
        await updateSubscription(initialData.id, payload);
      } else {
        await createSubscription(payload);
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save subscription';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialData ? 'Edit Subscription' : 'Add New SaaS Subscription'}
            </h3>
            <p className="text-xs text-slate-500">
              {initialData ? `Updating ${initialData.name}` : 'Record a new recurring software contract'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subscription Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GitHub Enterprise"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vendor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GitHub, Inc."
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost per Cycle <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.cost_per_cycle}
                  onChange={(e) => setFormData({ ...formData, cost_per_cycle: e.target.value })}
                  className="w-full text-xs pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Cycle <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="pending_review">Pending Review</option>
                <option value="trial">Trial</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Engineering Lead"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="credit_card">Corporate Credit Card</option>
                <option value="invoice">Invoice / Net 30</option>
                <option value="wire">Bank Wire</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Renewal Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={formData.next_renewal_date}
                onChange={(e) => setFormData({ ...formData, next_renewal_date: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Licenses / Seats</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 50"
                value={formData.license_count}
                onChange={(e) => setFormData({ ...formData, license_count: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Active / Used Seats</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 35"
                value={formData.used_licenses}
                onChange={(e) => setFormData({ ...formData, used_licenses: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Used for deterministic idle license savings detection</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="What this software tool is used for..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              placeholder="Renewal renegotiation notes, contract clauses, terms..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialData ? 'Update Subscription' : 'Create Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
