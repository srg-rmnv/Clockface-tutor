
import React, { useRef, useState, useEffect } from 'react';

interface AnalogClockProps {
  hours: number;
  minutes: number;
  size?: number;
  interactive?: boolean;
  onTimeChange?: (h: number, m: number) => void;
}

const AnalogClock: React.FC<AnalogClockProps> = ({ 
  hours, 
  minutes, 
  size = 300, 
  interactive = false,
  onTimeChange 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState<'hours' | 'minutes' | null>(null);

  // Normalize hours for display (12h clock face)
  const displayHours = hours % 12;
  
  // Hour hand moves 30 degrees per hour, plus 0.5 per minute
  const hourAngle = (displayHours * 30) + (minutes * 0.5);
  // Minute hand moves 6 degrees per minute
  const minuteAngle = minutes * 6;

  const radius = size / 2;
  const center = size / 2;
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  // Handle interaction
  const handlePointer = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    if (!interactive || !onTimeChange || !svgRef.current) return;

    // Get coordinates relative to SVG center
    const rect = svgRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left - center;
    const y = clientY - rect.top - center;

    // Calculate angle in degrees (0 is at 12 o'clock)
    // atan2 returns angle from x-axis, so we adjust coordinate system
    // We want 12 o'clock to be -90 deg in standard math, or just swap x/y logic
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    // Distance from center determines if we are setting hours or minutes
    const distance = Math.sqrt(x * x + y * y);
    const isMinuteInteraction = distance > radius * 0.55;

    if (e.type === 'pointerdown' || e.type === 'mousedown' || e.type === 'touchstart') {
       setIsDragging(isMinuteInteraction ? 'minutes' : 'hours');
    }

    // Snap to values
    if (isMinuteInteraction || isDragging === 'minutes') {
      // 6 degrees per minute. Round to nearest 5 minutes for easier usage? 
      // Let's round to nearest minute, but commonly users want 5 min steps in learning apps.
      // Let's stick to 1 minute precision but maybe 5 for easier snapping? 
      // Let's do 5 minute snapping for UX unless it's very precise.
      const rawMinutes = Math.round(angle / 6);
      const snappedMinutes = (Math.round(rawMinutes / 5) * 5) % 60;
      onTimeChange(hours, snappedMinutes);
    } else {
      // 30 degrees per hour. 
      const rawHour = Math.round(angle / 30);
      const snappedHour = rawHour === 0 ? 12 : rawHour;
      // Preserve existing minutes, update hour. 
      // Logic complexity: changing hour hand doesn't change AM/PM or 24h, just the visual 1-12
      // We need to keep the "offset" of the current 24h value.
      // If current is 14 (2 PM) and user clicks 3, it should become 15 (3 PM).
      const isPM = hours >= 12;
      const newHour24 = (snappedHour === 12 ? 0 : snappedHour) + (isPM ? 12 : 0);
      // Edge case: 12 PM is 12, 12 AM is 0. 
      // If currently 12 (12pm) and click 1 -> 13 (1pm). 
      // If currently 0 (12am) and click 1 -> 1 (1am).
      
      // Simplified: Just update the 1-12 val, App handles 24h context if needed, 
      // but strictly speaking AnalogClock is 12h.
      // We will callback with the 12h representation for the visual, relying on App to maintain 24h state if it wants?
      // Actually simpler: The prompt implies the user sets the hands. 
      // If the target is 14:00, setting hands to 2:00 is correct.
      let newH = snappedHour;
      if (snappedHour === 12) newH = 0; // 0-11 internally usually easier
      
      // Attempt to preserve AM/PM context from the input 'hours' prop
      if (hours >= 12) newH += 12; 
      if (newH === 24) newH = 12; // Fix 12 PM edge case if math goes wrong
      if (newH === 0 && hours >= 12) newH = 12; // 12 PM check

      // Actually, standard behavior: just return 1-12 or 0-23?
      // Let's return the modified hour maintaining the 12h shift
      let adjustedHour = snappedHour;
      if (hours >= 12 && snappedHour !== 12) adjustedHour += 12;
      if (hours < 12 && snappedHour === 12) adjustedHour = 0; 
      
      onTimeChange(adjustedHour, minutes);
    }
  };

  const handleEnd = () => setIsDragging(null);

  return (
    <div 
      className={`relative drop-shadow-xl select-none touch-none ${interactive ? 'cursor-pointer' : ''}`} 
      style={{ width: size, height: size }}
      onPointerDown={handlePointer}
      onPointerMove={(e) => isDragging && handlePointer(e)}
      onPointerUp={handleEnd}
      onPointerLeave={handleEnd}
    >
      <svg 
        ref={svgRef}
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Interactive Highlight Ring */}
        {interactive && (
          <circle cx={center} cy={center} r={radius} fill={isDragging ? "#f0f9ff" : "transparent"} />
        )}

        {/* Clock Face Background */}
        <circle
          cx={center}
          cy={center}
          r={radius - 10}
          fill="white"
          stroke={interactive ? "#7209B7" : "#4CC9F0"}
          strokeWidth="12"
        />
        
        {/* Minute Ticks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const isHour = i % 5 === 0;
          const tickLength = isHour ? 15 : 8;
          const tickWidth = isHour ? 4 : 2;
          const tickColor = isHour ? "#7209B7" : "#CBD5E1";
          const angle = (i * 6) * (Math.PI / 180);
          const x1 = center + (radius - 25) * Math.sin(angle);
          const y1 = center - (radius - 25) * Math.cos(angle);
          const x2 = center + (radius - 25 - tickLength) * Math.sin(angle);
          const y2 = center - (radius - 25 - tickLength) * Math.cos(angle);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={tickColor}
              strokeWidth={tickWidth}
              strokeLinecap="round"
            />
          );
        })}

        {/* Numbers */}
        {numbers.map((num) => {
          const angle = (num * 30) * (Math.PI / 180);
          const numRadius = radius - 55; 
          const x = center + numRadius * Math.sin(angle);
          const y = center - numRadius * Math.cos(angle);
          
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-700 font-bold pointer-events-none"
              style={{ fontSize: size / 10, fontFamily: 'Comic Sans MS, sans-serif' }}
            >
              {num}
            </text>
          );
        })}
        
        {/* Minute Hand */}
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - (radius - 50)}
          stroke="#F72585"
          strokeWidth="8"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle}, ${center}, ${center})`}
          className={!isDragging ? "transition-transform duration-500 ease-in-out" : ""}
          style={{ opacity: interactive && isDragging === 'hours' ? 0.5 : 1 }}
        />

        {/* Hour Hand */}
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - (radius - 90)}
          stroke="#3A0CA3"
          strokeWidth="12"
          strokeLinecap="round"
          transform={`rotate(${hourAngle}, ${center}, ${center})`}
          className={!isDragging ? "transition-transform duration-500 ease-in-out" : ""}
          style={{ opacity: interactive && isDragging === 'minutes' ? 0.5 : 1 }}
        />

        {/* Center Dot */}
        <circle
          cx={center}
          cy={center}
          r={12}
          fill="#FFD60A"
          stroke="#F72585"
          strokeWidth="3"
        />
        
        {interactive && (
           <text x={center} y={size - 30} textAnchor="middle" className="fill-slate-400 text-xs font-sans pointer-events-none uppercase tracking-widest">
             Крути стрелки
           </text>
        )}
      </svg>
    </div>
  );
};

export default AnalogClock;
