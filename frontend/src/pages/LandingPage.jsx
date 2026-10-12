import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsApi } from '../services/api';
import { RatingStars } from '../components/common/RatingStars';
import { Badge } from '../components/common/Badge';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Repeat,
  DollarSign,
  BookOpen,
  Calculator,
  FlaskConical,
  Package,
} from 'lucide-react';

export function LandingPage() {
  const [categories, setCategories] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, itemRes] = await Promise.all([
          itemsApi.getCategories(),
          itemsApi.search({ size: 4, available: true }),
        ]);
        setCategories(catRes.data);
        setRecentItems(itemRes.data.content || []);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/items?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/items');
    }
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-6 h-6" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6" />;
      case 'FlaskConical':
        return <FlaskConical className="w-6 h-6" />;
      case 'Zap':
        return <Zap className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-900 text-white py-20 lg:py-28">
        {/* Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-semibold mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Peer-to-Peer College Item Sharing Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display max-w-4xl mx-auto leading-tight mb-6">
            Rent What You Need.{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              Lend What You Don't.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Borrow scientific calculators, lab equipment, textbooks, and chargers directly from fellow
            students. Save money, reduce waste, and build campus community.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full flex items-center pl-3">
              <Search className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search calculators, books, lab coats, chargers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none py-2"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              Explore Items
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-14 text-left">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-indigo-400 font-bold text-xl font-display">₹10 - ₹50</div>
              <div className="text-xs text-slate-400">Typical Daily Rates</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-emerald-400 font-bold text-xl font-display">100% Peer</div>
              <div className="text-xs text-slate-400">Campus Verified Students</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-amber-400 font-bold text-xl font-display">Simulated</div>
              <div className="text-xs text-slate-400">Safe Zero-Risk UPI Flow</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-violet-400 font-bold text-xl font-display">AI Assistant</div>
              <div className="text-xs text-slate-400">RAG Catalog Recommendations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Browse by Campus Category
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
              Find exactly what you need for this semester's exams, lab sessions, and classes.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/items?categoryId=${cat.id}`}
                className="group p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition mb-3 shadow-sm">
                  {getCategoryIcon(cat.icon)}
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Featured Campus Listings
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Recently added items ready for rental this week.
              </p>
            </div>
            <Link
              to="/items"
              className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col group"
              >
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={
                      item.imageUrl ||
                      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=500&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge status={item.condition} />
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 shadow-sm">
                    {item.category?.name}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-indigo-600 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Daily Rate</div>
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{item.dailyPrice}{' '}
                        <span className="text-xs font-normal text-slate-500">/ day</span>
                      </div>
                    </div>
                    <Link
                      to={`/items/${item.id}`}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-xs font-bold rounded-xl transition"
                    >
                      Rent Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 font-display mb-4">
            How CampusShare Works
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto mb-16">
            A seamless, secure 3-step rental lifecycle built strictly to institutional syllabus standards.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-5 shadow-md shadow-indigo-200">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">Pick Dates & Request</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Borrowers search items, choose start and return dates. Rental amount is calculated on the
                server via BigDecimal (Daily rate × Total Days).
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-5 shadow-md shadow-violet-200">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">Owner Decision & Overlap Lock</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                The owner reviews the request and approves or rejects with reason. The system strictly
                prevents double-booking overlapping dates.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-5 shadow-md shadow-emerald-200">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">Return, Settle & Review</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                After the physical handover return, the owner marks RETURNED and records payment. The
                borrower submits a 1-5 star review and comment!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Callout */}
      <section className="py-16 bg-gradient-to-r from-violet-900 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Database RAG Powered Assistant
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display">
              Need something specific for tomorrow's exam?
            </h3>
            <p className="text-slate-300 text-sm mt-2 max-w-lg">
              Ask our Campus Assistant questions like "Is there a scientific calculator under Rs.30 per day?" and get instant answers pulled directly from available listings.
            </p>
          </div>
          <Link
            to="/chat"
            className="px-6 py-3.5 bg-white text-indigo-900 hover:bg-slate-100 font-bold text-sm rounded-xl shadow-lg transition flex-shrink-0 flex items-center gap-2"
          >
            Chat with Assistant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
