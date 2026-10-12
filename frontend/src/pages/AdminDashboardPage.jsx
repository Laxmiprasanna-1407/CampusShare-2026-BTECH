import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import {
  Users,
  Package,
  Clock,
  DollarSign,
  Activity,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Server,
  Receipt,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { user: currentUser } = useAuth();

  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Active Tab: 'users' | 'rentals' | 'payments'
  const [activeTab, setActiveTab] = useState('users');

  // Tab Data States
  const [usersList, setUsersList] = useState([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(0);

  const [rentalsList, setRentalsList] = useState([]);
  const [rentalsPage, setRentalsPage] = useState(0);
  const [rentalsTotalPages, setRentalsTotalPages] = useState(0);

  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(0);

  const [tabLoading, setTabLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  const loadStatsAndHealth = async () => {
    setStatsLoading(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getHealth().catch(() => ({ data: { status: 'UP' } })),
      ]);
      setStats(statsRes.data);
      setHealth(healthRes.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUsers = async (p = 0) => {
    setTabLoading(true);
    try {
      const res = await adminApi.getUsers({ page: p, size: 10 });
      setUsersList(res.data.content || []);
      setUsersTotalPages(res.data.totalPages || 0);
      setUsersPage(p);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setTabLoading(false);
    }
  };

  const loadRentals = async (p = 0) => {
    setTabLoading(true);
    try {
      const res = await adminApi.getRentals({ page: p, size: 10 });
      setRentalsList(res.data.content || []);
      setRentalsTotalPages(res.data.totalPages || 0);
      setRentalsPage(p);
    } catch (err) {
      console.error('Failed to load rentals:', err);
    } finally {
      setTabLoading(false);
    }
  };

  const loadPayments = async (p = 0) => {
    setTabLoading(true);
    try {
      const res = await adminApi.getPayments({ page: p, size: 10 });
      setPaymentsList(res.data.content || []);
      setPaymentsTotalPages(res.data.totalPages || 0);
      setPaymentsPage(p);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndHealth();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers(0);
    else if (activeTab === 'rentals') loadRentals(0);
    else if (activeTab === 'payments') loadPayments(0);
  }, [activeTab]);

  const handleToggleUserStatus = async (userToToggle) => {
    if (userToToggle.email.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert('Administrators cannot disable their own account!');
      return;
    }
    const newStatus = !userToToggle.enabled;
    try {
      await adminApi.toggleUserStatus(userToToggle.id, newStatus);
      setActionFeedback(`User ${userToToggle.email} ${newStatus ? 'enabled' : 'disabled'} successfully.`);
      loadUsers(usersPage);
      loadStatsAndHealth();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              Administrator Oversight
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              Admin Only
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time platform metrics, user moderation, rental auditing, and actuator health monitoring
          </p>
        </div>

        <button
          onClick={() => {
            loadStatsAndHealth();
            if (activeTab === 'users') loadUsers(usersPage);
            else if (activeTab === 'rentals') loadRentals(rentalsPage);
            else if (activeTab === 'payments') loadPayments(paymentsPage);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {actionFeedback && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback('')} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      {statsLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Users
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {stats?.totalUsers || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats?.totalStudents || 0} verified students
            </div>
          </div>

          {/* Card 2: Items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Catalog Items
              </span>
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {stats?.totalItems || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats?.activeItems || 0} active & available
            </div>
          </div>

          {/* Card 3: Rentals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Rentals
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {stats?.totalRentals || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats?.pendingRentals || 0} pending • {stats?.approvedRentals || 0} approved
            </div>
          </div>

          {/* Card 4: Platform Revenue & Health */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Simulated Volume
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              ₹{stats?.totalRevenue || '0.00'}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              System Status: {health?.status || 'UP'}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Users Moderation
        </button>

        <button
          onClick={() => setActiveTab('rentals')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'rentals'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          All Platform Rentals
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Payment Transactions
        </button>
      </div>

      {/* Tab 1: Users Moderation */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {tabLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Name & Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">College ID</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {u.collegeId || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{u.phone || '—'}</td>
                        <td className="px-6 py-4">
                          {u.enabled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              u.enabled
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {u.enabled ? 'Disable User' : 'Enable User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={usersPage}
                  totalPages={usersTotalPages}
                  onPageChange={(p) => loadUsers(p)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Rentals List */}
      {activeTab === 'rentals' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {tabLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Borrower</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rentalsList.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">#{r.id}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {r.item?.title}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {r.borrower?.name} ({r.borrower?.email})
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {r.startDate} → {r.endDate} ({r.totalDays}d)
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">₹{r.totalAmount}</td>
                        <td className="px-6 py-4">
                          <Badge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={rentalsPage}
                  totalPages={rentalsTotalPages}
                  onPageChange={(p) => loadRentals(p)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Payments Audit */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {tabLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Payment ID</th>
                      <th className="px-6 py-4">Rental ID</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Simulated Reference</th>
                      <th className="px-6 py-4">Paid Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentsList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">#{p.id}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">#{p.rentalId}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-900">₹{p.amount}</td>
                        <td className="px-6 py-4">
                          <Badge status={p.status} />
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {p.transactionReference || 'PENDING_SETTLEMENT'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {p.paidAt ? new Date(p.paidAt).toLocaleString() : 'Not yet paid'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={paymentsPage}
                  totalPages={paymentsTotalPages}
                  onPageChange={(p) => loadPayments(p)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
