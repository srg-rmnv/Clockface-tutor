import React from 'react';

interface OptionButtonProps {
  timeStr: string;
  onClick: () => void;
  disabled: boolean;
  state: 'default' | 'correct' | 'wrong';
}

const OptionButton: React.FC<OptionButtonProps> = ({ timeStr, onClick, disabled, state }) => {
  let bgClass = "bg-white hover:bg-sky-100 border-kid-blue text-kid-blue";
  
  if (state === 'correct') {
    bgClass = "bg-kid-green border-kid-green text-white scale-110";
  } else if (state === 'wrong') {
    bgClass = "bg-red-400 border-red-400 text-white opacity-50";
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 text-3xl font-bold rounded-2xl border-b-8 active:border-b-0 active:translate-y-2 transition-all duration-200 shadow-lg
        ${bgClass}
      `}
    >
      {timeStr}
    </button>
  );
};

export default OptionButton;