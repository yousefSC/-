import React from 'react';
import Icon from '../Icon';
import { TranslationKey } from '../../types';

interface PointsMeterProps {
  currentPoints: number;
  maxPoints: number;
  t: (key: TranslationKey) => string;
}

const PointsMeter: React.FC<PointsMeterProps> = ({ currentPoints, maxPoints, t }) => {
  const percentage = maxPoints > 0 ? (currentPoints / maxPoints) * 100 : 0;
  
  // Determine color based on percentage
  const getBarColor = () => {
    if (percentage > 50) return 'bg-gradient-to-r from-sky-500 to-cyan-400';
    if (percentage > 20) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return 'bg-gradient-to-r from-red-600 to-rose-500';
  };

  return (
    <div className="mt-2 w-full">
      <div className="flex justify-between items-center mb-1 text-xs font-mono">
         <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Icon name="zap" className="w-3.5 h-3.5 text-blue-500" />
            {t('proPointsRemaining')}
        </span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          {currentPoints} / {maxPoints}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default PointsMeter;
