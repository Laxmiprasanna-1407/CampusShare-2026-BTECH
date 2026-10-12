import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { itemsApi } from '../services/api';
import { RatingStars } from '../components/common/RatingStars';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  PackageX,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export function BrowseItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter States
  const keyword = searchParams.get('keyword') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const availableOnly = searchParams.get('available') !== 'false';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'createdAt,desc';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const [searchInput, setSearchInput] = useState(keyword);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await itemsApi.getCategories();
        setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        const params = {
          page,
          size: 12,
          sort,
        };
        if (keyword.trim()) params.keyword = keyword.trim();
        if (categoryId) params.categoryId = categoryId;
        if (availableOnly) params.available = true;
        if (maxPrice) params.maxPrice = maxPrice;

        const res = await itemsApi.search(params);
        setItems(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      } catch (err) {
        console.error('Failed to load items', err);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [keyword, categoryId, availableOnly, maxPrice, sort, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== '') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '0'); // Reset page on filter changes
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('keyword', searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display">Campus Rental Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse through items listed by university peers ({totalElements} items listed)
          </p>
        </div>

        <Link
          to="/chat"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 text-xs sm:text-sm font-semibold transition"
        >
          <Sparkles className="w-4 h-4 text-violet-600" />
          Ask AI Assistant to Search
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-8 space-y-4">
        {/* Keyword Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, brand, textbook author, subject, or equipment..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
          >
            Search
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => updateParam('categoryId', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Max Daily Rate (₹)
            </label>
            <input
              type="number"
              min="1"
              value={maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="createdAt,desc">Newest Listings</option>
              <option value="dailyPrice,asc">Price: Low to High</option>
              <option value="dailyPrice,desc">Price: High to Low</option>
            </select>
          </div>

          {/* Actions / Reset */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Items Grid or Empty State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium">Loading campus listings...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackageX className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-display">No items matched your query</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
            Try broadening your search term, selecting "All Categories", or asking the AI Assistant!
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col group hover:-translate-y-1"
              >
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={
                      item.imageUrl ||
                      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=500&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <Badge status={item.condition} />
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-800 shadow-2xs">
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

                    <div className="mt-3 flex items-center justify-between">
                      <RatingStars rating={item.averageRating || 0} totalReviews={item.totalReviews} />
                      <span className="text-[11px] text-slate-400 font-medium">
                        Owner: {item.owner?.name?.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Daily Price</div>
                      <div className="text-lg font-extrabold text-slate-900">
                        ₹{item.dailyPrice}{' '}
                        <span className="text-xs font-normal text-slate-500">/ day</span>
                      </div>
                    </div>
                    <Link
                      to={`/items/${item.id}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      View & Rent
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => updateParam('page', nextPage.toString())}
          />
        </>
      )}
    </div>
  );
}
