
import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (newRating: number) => void;
  disabled?: boolean;
}

const Star: React.FC<{
  filled: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  interactive: boolean;
}> = ({ filled, onClick, onMouseEnter, onMouseLeave, interactive }) => (
  <svg
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={`w-5 h-5 ${
      filled ? 'text-yellow-400' : 'text-gray-500'
    } ${interactive ? 'cursor-pointer transition-transform hover:scale-125' : ''}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
  </svg>
);

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  disabled = false,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleRating = (newRating: number) => {
    if (!disabled && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!disabled) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          filled={index <= displayRating}
          onClick={() => handleRating(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          interactive={!disabled}
        />
      ))}
    </div>
  );
};
