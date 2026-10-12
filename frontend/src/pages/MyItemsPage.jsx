import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemsApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { RatingStars } from '../components/common/RatingStars';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import {
  Package,
  PlusCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export function MyItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal State for Deletion
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchMyItems = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const res = await itemsApi.getMine({ page: pageNumber, size: 10 });
      setItems(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      setPage(pageNumber);
    } catch (err) {
      console.error('Failed to load my items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems(0);
  }, []);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await itemsApi.delete(itemToDelete.id);
      setFeedbackMsg(`"${itemToDelete.title}" was soft-deleted and removed from catalog search.`);
      setItemToDelete(null);
      fetchMyItems(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display">My Listed Items</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your items available for campus rental ({totalElements} listed)
          </p>
        </div>

        <Link
          to="/items/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Item
        </Link>
      </div>

      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button
            onClick={() => setFeedbackMsg('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading your items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center p-8 max-w-md mx-auto">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-display">No items listed yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
            Have calculators, lab equipment, books, or chargers lying around? List them to start earning rental fees!
          </p>
          <Link
            to="/items/new"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            List Your First Item
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Daily Rate</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.imageUrl ||
                            'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <Link
                            to={`/items/${item.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition block line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <RatingStars rating={item.averageRating || 0} totalReviews={item.totalReviews} size="sm" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {item.category?.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-900">₹{item.dailyPrice}</span>
                      <span className="text-xs text-slate-400"> /day</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={item.condition} />
                    </td>
                    <td className="px-6 py-4">
                      {item.available ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/items/${item.id}`}
                          title="View Details"
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/items/${item.id}/edit`}
                          title="Edit Item"
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          title="Delete Listing"
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => fetchMyItems(nextPage)}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Item Deletion */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Confirm Item Deletion"
        onConfirm={confirmDelete}
        confirmLabel="Yes, Delete Listing"
        confirmVariant="danger"
        loading={deleteLoading}
      >
        <div className="space-y-3">
          <p className="text-slate-700">
            Are you sure you want to delete <strong>"{itemToDelete?.title}"</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed">
            <strong>Audit & History Notice:</strong> To ensure historical integrity for past rentals, transactions, and reviews, this item will be <strong>soft-deleted</strong>. It will immediately cease appearing in public search results.
          </div>
        </div>
      </Modal>
    </div>
  );
}
