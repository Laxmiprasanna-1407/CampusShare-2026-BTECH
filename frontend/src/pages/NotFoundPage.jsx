import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 font-display mb-2">404</h1>
        <h2 className="text-lg font-bold text-slate-700 mb-3">Page Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed">
          The campus page or item listing you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition w-full"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Campus Home
        </Link>
      </div>
    </div>
  );
}
