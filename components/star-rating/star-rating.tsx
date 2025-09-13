import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
}

export function StarRating({
  rating,
  onRatingChange,
  maxRating = 5,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= (hoverRating || rating);

        return (
          <button
            key={index}
            type="button"
            className={`text-2xl transition-colors duration-200 ${
              isActive ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
            onClick={() => onRatingChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
          >
            ★
          </button>
        );
      })}
      <span className="ml-2 text-sm text-muted-foreground">
        {rating > 0 ? `${rating}/${maxRating}` : 'Rate clarity'}
      </span>
    </div>
  );
}
