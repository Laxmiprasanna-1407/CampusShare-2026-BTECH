import React from 'react';
import { Share2, Info, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight font-display">CampusShare</span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              A peer-to-peer campus item rental platform designed for university students to share
              calculators, textbooks, lab equipment, and hardware accessories reliably and affordably.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Academic Prototype Notice:</strong> Payments on this platform are completely simulated (no real credit cards or financial transactions).
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3 font-display">
              Explore
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/items" className="hover:text-indigo-400 transition">Browse Items</Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-indigo-400 transition">AI Assistant</Link>
              </li>
              <li>
                <Link to="/items/new" className="hover:text-indigo-400 transition">List an Item</Link>
              </li>
              <li>
                <Link to="/my-rentals" className="hover:text-indigo-400 transition">Track Rentals</Link>
              </li>
            </ul>
          </div>

          {/* Technology & Compliance */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3 font-display">
              Stack & Security
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Spring Boot 3 + JWT Security</span>
              </li>
              <li>React 19 + Vite + Tailwind</li>
              <li>MySQL 8 + Flyway Migrations</li>
              <li>RAG AI Retrieval Engine</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CampusShare Platform. Built for College Students.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Academic Peer Sharing
          </p>
        </div>
      </div>
    </footer>
  );
}
