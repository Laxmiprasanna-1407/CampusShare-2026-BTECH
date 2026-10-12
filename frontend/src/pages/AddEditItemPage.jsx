import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemsApi } from '../services/api';
import { Modal } from '../components/common/Modal';
import {
  PackagePlus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Tag,
  DollarSign,
  Shield,
  FileText,
} from 'lucide-react';

export function AddEditItemPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    dailyPrice: '',
    deposit: '0',
    condition: 'LIKE_NEW',
    imageUrl: '',
    description: '',
    tagsString: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const catRes = await itemsApi.getCategories();
        setCategories(catRes.data);

        if (isEditing) {
          const itemRes = await itemsApi.getById(id);
          const it = itemRes.data;
          setFormData({
            title: it.title,
            categoryId: it.category?.id?.toString() || '',
            dailyPrice: it.dailyPrice?.toString() || '',
            deposit: it.deposit?.toString() || '0',
            condition: it.condition || 'LIKE_NEW',
            imageUrl: it.imageUrl || '',
            description: it.description || '',
            tagsString: (it.tags || []).join(', '),
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize form');
      } finally {
        setInitialLoading(false);
      }
    }
    loadInitial();
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.categoryId) {
      setError('Please select a category for this item.');
      return;
    }
    if (parseFloat(formData.dailyPrice) < 1) {
      setError('Daily rental rate must be at least ₹1.00');
      return;
    }

    // Open confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      const tagsArray = formData.tagsString
        ? formData.tagsString
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        categoryId: parseInt(formData.categoryId, 10),
        dailyPrice: parseFloat(formData.dailyPrice),
        deposit: parseFloat(formData.deposit || '0'),
        condition: formData.condition,
        imageUrl: formData.imageUrl.trim(),
        description: formData.description.trim(),
        tags: tagsArray,
      };

      if (isEditing) {
        await itemsApi.update(id, payload);
      } else {
        await itemsApi.create(payload);
      }

      navigate('/my-items');
    } catch (err) {
      setError(
        err.response?.data?.details?.join(', ') ||
        err.response?.data?.message ||
        'Failed to save listing. Please check required fields.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading listing details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          to="/my-items"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Items
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">
              {isEditing ? 'Edit Item Listing' : 'Post a New Campus Item'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {isEditing
                ? 'Update specifications, pricing, and availability'
                : 'List an item for other college peers to rent during the semester'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Item Title *
            </label>
            <input
              type="text"
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Casio fx-991CW Scientific Calculator"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                required
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option value="">Select a Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Item Condition *
              </label>
              <select
                required
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option value="NEW">New (Brand New)</option>
                <option value="LIKE_NEW">Like New (Mint)</option>
                <option value="GOOD">Good (Light Use)</option>
                <option value="FAIR">Fair (Visible Wear)</option>
              </select>
            </div>
          </div>

          {/* Daily Price & Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Daily Price (₹) *
              </label>
              <input
                type="number"
                step="0.50"
                min="1"
                required
                name="dailyPrice"
                value={formData.dailyPrice}
                onChange={handleChange}
                placeholder="25.00"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                name="deposit"
                value={formData.deposit}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Photo / Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Tags (Comma separated)
            </label>
            <input
              type="text"
              name="tagsString"
              value={formData.tagsString}
              onChange={handleChange}
              placeholder="Engineering, Semester 1, Math, Fast Charging"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Handover Notes
            </label>
            <textarea
              rows="4"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Specify model numbers, accessories included (case, cables), preferred campus meetup spots..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <Link
              to="/my-items"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isEditing ? 'Save Changes' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={isEditing ? 'Confirm Changes' : 'Confirm Listing Publication'}
        onConfirm={handleConfirmSave}
        confirmLabel={isEditing ? 'Save Changes' : 'Publish Listing'}
        loading={loading}
      >
        <p className="text-slate-600 leading-relaxed">
          {isEditing
            ? `Are you sure you want to update "${formData.title}"? The new rates and descriptions will be visible immediately to students.`
            : `Are you ready to publish "${formData.title}" at ₹${formData.dailyPrice}/day? Other students on campus will be able to discover and request to rent this item.`}
        </p>
      </Modal>
    </div>
  );
}
