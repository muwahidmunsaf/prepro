import React, { useState, useEffect } from 'react';
import { ClockIcon } from './icons';

interface TimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
  isPaused?: boolean;
  initialSeconds?: number;
  onTick?: (secondsLeft: number) => void;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, isPaused = false, initialSeconds, onTick }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds ?? duration * 60);

  useEffect(() => {
    if (typeof initialSeconds === 'number') {
      setTimeLeft(initialSeconds);
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) {
      if (timeLeft <= 0) {
        onTimeUp();
      }
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          onTimeUp();
          return 0;
        }
        const next = prevTime - 1;
        onTick && onTick(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp, isPaused, onTick]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const isLowTime = timeLeft <= 60 && timeLeft > 0;

  return (
    <div className={`flex items-center space-x-2 p-2 rounded-lg ${isLowTime ? 'text-red-500 animate-pulse' : 'text-slate-700 dark:text-slate-200'}`}>
        <ClockIcon className="w-5 h-5" />
        <span className="font-mono font-bold text-lg">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    </div>
  );
};

export default Timer;