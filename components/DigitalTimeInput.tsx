
import React from 'react';

interface DigitalTimeInputProps {
  hours: number;
  minutes: number;
  is24Hour: boolean;
  onChange: (h: number, m: number) => void;
  disabled: boolean;
}

const DigitalTimeInput: React.FC<DigitalTimeInputProps> = ({ 
  hours, 
  minutes, 
  is24Hour, 
  onChange,
  disabled 
}) => {
  
  const incrementHours = () => {
    let newH = hours + 1;
    const limit = is24Hour ? 24 : 12;
    if (newH >= limit) newH = is24Hour ? 0 : 1; // 12h clock goes 12->1, 24h goes 23->0
    // edge case for 12h: if currently 12, next is 1. 
    // wait, standard 12h logic: 11 -> 12 -> 1. 
    if (!is24Hour && hours === 12) newH = 1;
    onChange(newH, minutes);
  };

  const decrementHours = () => {
    let newH = hours - 1;
    if (is24Hour) {
      if (newH < 0) newH = 23;
    } else {
      if (newH < 1) newH = 12;
    }
    onChange(newH, minutes);
  };

  const incrementMinutes = () => {
    let newM = minutes + 5;
    if (newM >= 60) newM = 0;
    onChange(hours, newM);
  };

  const decrementMinutes = () => {
    let newM = minutes - 5;
    if (newM < 0) newM = 55;
    onChange(hours, newM);
  };

  return (
    <div className="flex gap-4 items-center justify-center p-4 bg-white rounded-2xl shadow-md border-2 border-slate-100">
      {/* Hours */}
      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={incrementHours} 
          disabled={disabled}
          className="w-12 h-10 bg-sky-100 text-sky-600 rounded-t-lg hover:bg-sky-200 disabled:opacity-50 text-xl font-bold"
        >
          ▲
        </button>
        <div className="bg-slate-800 text-white font-mono text-4xl p-4 rounded-lg w-24 text-center">
          {hours.toString().padStart(2, '0')}
        </div>
        <button 
          onClick={decrementHours} 
          disabled={disabled}
          className="w-12 h-10 bg-sky-100 text-sky-600 rounded-b-lg hover:bg-sky-200 disabled:opacity-50 text-xl font-bold"
        >
          ▼
        </button>
      </div>

      <div className="text-4xl font-black text-slate-300 pb-2">:</div>

      {/* Minutes */}
      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={incrementMinutes} 
          disabled={disabled}
          className="w-12 h-10 bg-pink-100 text-pink-600 rounded-t-lg hover:bg-pink-200 disabled:opacity-50 text-xl font-bold"
        >
          ▲
        </button>
        <div className="bg-slate-800 text-white font-mono text-4xl p-4 rounded-lg w-24 text-center">
          {minutes.toString().padStart(2, '0')}
        </div>
        <button 
          onClick={decrementMinutes} 
          disabled={disabled}
          className="w-12 h-10 bg-pink-100 text-pink-600 rounded-b-lg hover:bg-pink-200 disabled:opacity-50 text-xl font-bold"
        >
          ▼
        </button>
      </div>
    </div>
  );
};

export default DigitalTimeInput;
