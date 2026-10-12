import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { itemsApi, rentalsApi, reviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RatingStars } from '../components/common/RatingStars';
import { Badge } from '../components/common/Badge';
import {
  Calendar,
  ShieldCheck,
  User,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  ArrowLeft,
  DollarSign,
  Clock,
} from 'lucide-react';

export function ItemDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rental form state
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(tomorrowStr);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      setError('');
      try {
        const [itemRes, reviewRes] = await Promise.all([
          itemsApi.getById(id),
          reviewsApi.getByItem(id),
        ]);
        setItem(itemRes.data);
        setReviews(reviewRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load item details');
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id]);

  // Live calculation of duration and total rental amount preview
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 1;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1; // inclusive rental duration
    return Math.max(1, diffDays);
  };

  const totalDays = calculateDays();
  const totalAmount = item ? (Number(item.dailyPrice) * totalDays).toFixed(2) : '0.00';

  const isOwner = user && item && user.id === item.owner?.id;

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/items/${id}` } } });
      return;
    }

    setBookingError('');
    setBookingLoading(true);

    try {
      await rentalsApi.create({
        itemId: item.id,
        startDate,
        endDate,
      });
      setBookingSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Unable to submit rental request. Please verify dates and try again.';
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading item specifications...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-display">Item Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'This listing does not exist or has been removed.'}</p>
        <Link to="/items" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          to="/items"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Item Image & Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="relative h-80 sm:h-96 bg-slate-100">
              <img
                src={
                  item.imageUrl ||
                  'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'
                }
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge status={item.condition} />
                <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-indigo-700 shadow-2xs">
                  {item.category?.name}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                  {item.title}
                </h1>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <RatingStars
                  rating={item.averageRating || 0}
                  totalReviews={item.totalReviews}
                  size="md"
                />
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-500">
                  Listed by {item.owner?.name} ({item.owner?.collegeId || 'Verified Peer'})
                </span>
              </div>

              <div className="border-t border-b border-slate-100 py-4 mb-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  About this item
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {item.description || 'No detailed description provided by the owner.'}
                </p>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Tags:
                  </span>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Owner Trust Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold font-display">
                    {item.owner?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.owner?.name}</div>
                    <div className="text-xs text-slate-500">{item.owner?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Student
                </div>
              </div>
            </div>
          </div>

          {/* Peer Reviews Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 font-display mb-4">
              Borrower Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No reviews yet. Be the first to rent and review this item once returned!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {rev.reviewer?.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({rev.reviewer?.collegeId})
                        </span>
                      </div>
                      <RatingStars rating={rev.rating} size="sm" />
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rental Booking Form */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-lg">
            <div className="flex items-baseline justify-between mb-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-3xl font-extrabold text-slate-900 font-display">
                  ₹{item.dailyPrice}
                </span>
                <span className="text-sm text-slate-500 font-medium ml-1">/ day</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Security Deposit</span>
                <span className="text-sm font-bold text-slate-700">
                  {item.deposit > 0 ? `₹${item.deposit}` : '₹0 (None)'}
                </span>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-base font-display">
                  Rental Request Sent!
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Your request has been routed to {item.owner?.name}. You will be notified once they approve or reject.
                </p>
                <div className="pt-2">
                  <Link
                    to="/my-rentals"
                    className="inline-block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    View in My Rentals
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {bookingError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Date Selection */}
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Rental Start Date
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      required
                      min={todayStr}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (e.target.value > endDate) {
                          setEndDate(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Return End Date
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      required
                      min={startDate || todayStr}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Server-Side Synchronized Price Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Duration:</span>
                    <span className="font-bold text-slate-900">{totalDays} day(s)</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Rate:</span>
                    <span>₹{item.dailyPrice} × {totalDays}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">Total Rental Amount:</span>
                    <span className="text-xl font-extrabold text-indigo-600 font-display">
                      ₹{totalAmount}
                    </span>
                  </div>
                </div>

                {/* Simulated Payment Notice */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    <strong>Simulated Payment:</strong> No money will be deducted from your bank. Payment status will be confirmed peer-to-peer upon handover.
                  </span>
                </div>

                {/* Submit Button */}
                {isOwner ? (
                  <div className="p-3 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl text-center">
                    You listed this item (students cannot rent their own items)
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-200 hover:shadow transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Request...
                      </>
                    ) : isAuthenticated ? (
                      'Request Rental'
                    ) : (
                      'Sign In to Rent'
                    )}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
