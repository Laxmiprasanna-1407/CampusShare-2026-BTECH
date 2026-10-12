import React from 'react';
import { Star } from 'lucide-react';

export function RatingStars({ rating = 0, totalReviews, interactive = false, onChange, size = 'sm' }) {
  const stars = [1, 2, 3, 4, 5];
  const sizeClasses = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {stars.map((star) => {
          const filled = interactive ? star <= rating : star <= Math.round(rating);
          return (
            <button
              type={interactive ? 'button' : undefined}
              key={star}
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(star)}
              className={`${
                interactive
                  ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-amber-400 rounded'
                  : 'cursor-default'
              }`}
              aria-label={interactive ? `Rate ${star} stars` : undefined}
            >
              <Star
                className={`${sizeClasses} ${
                  filled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300 fill-slate-100'
                }`}
              />
            </button>
          );
        })}
      </div>
      {!interactive && rating > 0 && (
        <span className="text-xs font-semibold text-slate-700">
          {rating.toFixed(1)}
          {typeof totalReviews === 'number' && (
            <span className="text-slate-500 font-normal ml-1">({totalReviews})</span>
          )}
        </span>
      )}
    </div>
  );
}
