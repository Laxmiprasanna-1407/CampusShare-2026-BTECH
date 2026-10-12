import React, { useState, useEffect } from 'react';
import { rentalsApi, paymentsApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import {
  Inbox,
  Check,
  X,
  RotateCcw,
  CreditCard,
  Calendar,
  User,
  DollarSign,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export function IncomingRequestsPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Rejection Modal State
  const [rejectRentalId, setRejectRentalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ text: '', type: 'success' });

  const fetchIncoming = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const res = await rentalsApi.getIncoming({ page: pageNumber, size: 10 });
      setRentals(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
      setPage(pageNumber);
    } catch (err) {
      console.error('Failed to load incoming requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncoming(0);
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await rentalsApi.approve(id);
      setAlertMsg({ text: `Rental #${id} approved successfully!`, type: 'success' });
      fetchIncoming(page);
    } catch (err) {
      setAlertMsg({
        text: err.response?.data?.message || 'Failed to approve rental.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectRentalId) return;
    setActionLoading(true);
    try {
      await rentalsApi.reject(rejectRentalId, { reason: rejectionReason });
      setAlertMsg({ text: `Rental #${rejectRentalId} was rejected.`, type: 'success' });
      setRejectRentalId(null);
      setRejectionReason('');
      fetchIncoming(page);
    } catch (err) {
      setAlertMsg({
        text: err.response?.data?.message || 'Failed to reject rental.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReturned = async (id) => {
    setActionLoading(true);
    try {
      await rentalsApi.markReturned(id);
      setAlertMsg({ text: `Rental #${id} marked as RETURNED.`, type: 'success' });
      fetchIncoming(page);
    } catch (err) {
      setAlertMsg({
        text: err.response?.data?.message || 'Failed to mark rental as returned.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaymentPaid = async (rentalId) => {
    setActionLoading(true);
    try {
      await paymentsApi.markPaid(rentalId);
      setAlertMsg({
        text: `Simulated payment for Rental #${rentalId} recorded as PAID.`,
        type: 'success',
      });
      fetchIncoming(page);
    } catch (err) {
      setAlertMsg({
        text: err.response?.data?.message || 'Failed to record payment.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">
          Incoming Rental Requests
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review borrower rental dates, approve bookings, record returns, and manage peer payments ({totalElements} requests)
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
          <p className="text-sm font-medium text-slate-500">Loading incoming requests...</p>
        </div>
      ) : rentals.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center p-8 max-w-md mx-auto">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-display">No incoming requests yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            When campus peers request your equipment, their dates and calculated amounts will appear here for your approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => (
            <div
              key={rental.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Left: Item & Borrower Details */}
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
                    <span className="text-xs font-bold text-indigo-600">Rental #{rental.id}</span>
                    <Badge status={rental.status} />
                    {rental.payment && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600">
                        Payment: {rental.payment.status}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    {rental.item?.title}
                  </h3>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Borrower: <strong>{rental.borrower?.name}</strong> ({rental.borrower?.email})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {rental.startDate} → {rental.endDate} ({rental.totalDays} days)
                    </span>
                  </div>

                  {rental.rejectionReason && (
                    <p className="text-xs text-rose-600 font-medium pt-1">
                      Reason: {rental.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Server Calculated Amount & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-left lg:text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Rental Amount</div>
                  <div className="text-xl font-extrabold text-slate-900 font-display">
                    ₹{rental.totalAmount}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Status: PENDING -> Approve or Reject */}
                  {rental.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleApprove(rental.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          setRejectRentalId(rental.id);
                          setRejectionReason('');
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}

                  {/* Status: APPROVED -> Mark Returned & Mark Payment Paid */}
                  {rental.status === 'APPROVED' && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleMarkReturned(rental.id)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Mark Returned
                      </button>

                      {rental.payment?.status !== 'PAID' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleMarkPaymentPaid(rental.id)}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Mark Paid
                        </button>
                      )}
                    </>
                  )}

                  {/* Status: RETURNED with payment PENDING */}
                  {rental.status === 'RETURNED' && rental.payment?.status !== 'PAID' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleMarkPaymentPaid(rental.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Mark Payment Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => fetchIncoming(nextPage)}
          />
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={Boolean(rejectRentalId)}
        onClose={() => setRejectRentalId(null)}
        title="Reject Rental Request"
        onConfirm={handleConfirmReject}
        confirmLabel="Confirm Rejection"
        confirmVariant="danger"
        loading={actionLoading}
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Please provide an optional reason for rejecting Rental #{rejectRentalId} to inform the borrower.
          </p>
          <textarea
            rows="3"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Item is undergoing routine maintenance, or personal exam clash..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </Modal>
    </div>
  );
}
