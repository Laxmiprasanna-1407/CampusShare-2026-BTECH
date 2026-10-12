import React, { useState, useEffect } from 'react';
import { rentalsApi, reviewsApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { RatingStars } from '../components/common/RatingStars';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import {
  Clock,
  XCircle,
  Star,
  Calendar,
  User,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function MyRentalsPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Cancellation Modal State
  const [rentalToCancel, setRentalToCancel] = useState(null);

  // Review Modal State
  const [reviewRental, setReviewRental] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: 'success' });

  const fetchMyRentals = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const res = await rentalsApi.getMine({ page: pageNumber, size: 10 });
      setRentals(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      setPage(pageNumber);
    } catch (err) {
      console.error('Failed to load my rentals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRentals(0);
  }, []);

  const handleConfirmCancel = async () => {
    if (!rentalToCancel) return;
    setActionLoading(true);
    try {
      await rentalsApi.cancel(rentalToCancel.id);
      setAlertMsg({ text: `Rental #${rentalToCancel.id} cancelled successfully.`, type: 'success' });
      setRentalToCancel(null);
      fetchMyRentals(page);
    } catch (err) {
      setAlertMsg({
        text: err.response?.data?.message || 'Failed to cancel rental.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReview = async () => {
    if (!reviewRental) return;
    setActionLoading(true);
    try {
      await reviewsApi.create(reviewRental.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setAlertMsg({
        text: `Thank you! Your ${reviewRating}-star review has been published.`,
        type: 'success',
      });
      setReviewRental(null);
      setReviewComment('');
      setReviewRating(5);
      fetchMyRentals(page);
    } catch (err) {
      setAlertMsg({
        text: err.response?.data?.message || 'Failed to submit review.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">My Rental Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track the status of your borrowed items, cancellation options, and feedback reviews ({totalElements} rentals)
        </p>
      </div>

      {alertMsg.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between ${
            alertMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button
            onClick={() => setAlertMsg({ text: '', type: 'success' })}
            className="font-bold text-xs hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading your rentals...</p>
        </div>
      ) : rentals.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center p-8 max-w-md mx-auto">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-display">No rentals yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
            Looking for a scientific calculator, engineering textbook, or fast charger? Browse campus listings now!
          </p>
          <Link
            to="/items"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-block"
          >
            Browse Campus Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => (
            <div
              key={rental.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left Column: Item & Owner */}
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={
                    rental.item?.imageUrl ||
                    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={rental.item?.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600">Booking #{rental.id}</span>
                    <Badge status={rental.status} />
                    {rental.payment && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600">
                        Payment: {rental.payment.status}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/items/${rental.item?.id}`}
                    className="font-bold text-slate-900 text-base sm:text-lg hover:text-indigo-600 transition block"
                  >
                    {rental.item?.title}
                  </Link>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Owner: <strong>{rental.item?.owner?.name}</strong> ({rental.item?.owner?.email})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {rental.startDate} → {rental.endDate} ({rental.totalDays} days)
                    </span>
                  </div>

                  {/* Review feedback if already written */}
                  {rental.review && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                      <div className="flex items-center gap-2 font-bold mb-0.5">
                        <RatingStars rating={rental.review.rating} size="sm" />
                        <span>Your Review:</span>
                      </div>
                      <p className="italic text-slate-700">"{rental.review.comment}"</p>
                    </div>
                  )}

                  {rental.rejectionReason && (
                    <p className="text-xs text-rose-600 font-medium pt-1">
                      Rejection Reason: {rental.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Amount & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-left lg:text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Rental Amount</div>
                  <div className="text-xl font-extrabold text-slate-900 font-display">
                    ₹{rental.totalAmount}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Status: PENDING -> Borrower can cancel */}
                  {rental.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setRentalToCancel(rental)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Request
                    </button>
                  )}

                  {/* Status: RETURNED -> Borrower can submit review if not already reviewed */}
                  {rental.status === 'RETURNED' && !rental.review && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        setReviewRental(rental);
                        setReviewRating(5);
                        setReviewComment('');
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Write Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => fetchMyRentals(nextPage)}
          />
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={Boolean(rentalToCancel)}
        onClose={() => setRentalToCancel(null)}
        title="Cancel Rental Request"
        onConfirm={handleConfirmCancel}
        confirmLabel="Yes, Cancel Request"
        confirmVariant="danger"
        loading={actionLoading}
      >
        <p className="text-slate-600 text-sm">
          Are you sure you want to cancel your rental request for{' '}
          <strong>"{rentalToCancel?.item?.title}"</strong>? This will notify the owner that you no longer need the item.
        </p>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(reviewRental)}
        onClose={() => setReviewRental(null)}
        title={`Review "${reviewRental?.item?.title}"`}
        onConfirm={handleConfirmReview}
        confirmLabel="Submit Review"
        loading={actionLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Your Rating (1 to 5 Stars) *
            </label>
            <RatingStars
              rating={reviewRating}
              interactive={true}
              onChange={(newRating) => setReviewRating(newRating)}
              size="lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Review Comment
            </label>
            <textarea
              rows="3"
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How was the condition of the item? Was the handover on campus smooth?"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
