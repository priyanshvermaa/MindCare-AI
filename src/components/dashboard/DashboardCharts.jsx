import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Helper to calculate SVG paths for smooth line curves
const getBezierPath = (points) => {
  if (points.length < 2) return '';
  return points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = a[i - 1];
    const cpX1 = prev.x + (point.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (point.x - prev.x) / 2;
    const cpY2 = point.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;
  }, '');
};

// 1. WEEKLY MOOD TREND (Line Chart)
export const WeeklyMoodTrend = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const hasData = data && data.length > 0 && data.some(item => item.mood > 0);
  if (!hasData) return <div className="text-xs text-slate-400 py-10 text-center font-bold">No data available yet.</div>;

  const width = 500;
  const height = 200;
  const padding = { top: 30, right: 30, bottom: 30, left: 40 };

  // Map data to coordinate points
  const points = data.map((item, idx) => {
    const x = padding.left + (idx * (width - padding.left - padding.right)) / (data.length - 1 || 1);
    const moodVal = item.mood || 3;
    const y = height - padding.bottom - ((moodVal - 1) / 4) * (height - padding.top - padding.bottom);
    return { x, y, label: item.day, value: moodVal };
  });

  const linePath = getBezierPath(points);
  
  // Close the path to form the area under the curve
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : '';

  return (
    <div className="relative w-full h-full">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="moodLineGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#A88BFF" />
          </linearGradient>
          <linearGradient id="moodAreaGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map((level) => {
          const y = height - padding.bottom - ((level - 1) / 4) * (height - padding.top - padding.bottom);
          return (
            <g key={level}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={padding.left - 12} y={y + 4} fill="#6B7280" className="text-[11px] font-bold" textAnchor="end">
                {level === 5 ? '😊' : level === 4 ? '🙂' : level === 3 ? '😐' : level === 2 ? '😔' : '😢'}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="url(#moodAreaGlow)" />
        )}

        {/* Main spline line */}
        {linePath && (
          <motion.path
            d={linePath}
            fill="none"
            stroke="url(#moodLineGlow)"
            strokeWidth="3.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}

        {/* X Axis Labels */}
        {points.map((point, idx) => (
          <g key={idx}>
            <text
              x={point.x}
              y={height - 10}
              fill="#6B7280"
              className="text-[10px] font-bold text-center"
              textAnchor="middle"
            >
              {point.label}
            </text>
            
            {/* Interactive dot handles */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIdx === idx ? 7 : 4}
              fill={hoveredIdx === idx ? '#7C5CFF' : '#A88BFF'}
              stroke="#FFFFFF"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          </g>
        ))}

        {/* Floating tooltip */}
        {hoveredIdx !== null && (
          <g>
            <rect
              x={points[hoveredIdx].x - 30}
              y={points[hoveredIdx].y - 32}
              width="60"
              height="20"
              rx="6"
              fill="#FFFFFF"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
            <text
              x={points[hoveredIdx].x}
              y={points[hoveredIdx].y - 18}
              fill="#7C5CFF"
              className="text-[10px] font-extrabold"
              textAnchor="middle"
            >
              Level {points[hoveredIdx].value}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// 2. MOOD DISTRIBUTION (Pie/Donut Segment Chart)
export const MoodDistribution = ({ data = [] }) => {
  const total = data ? data.reduce((sum, item) => sum + (item.value || 0), 0) : 0;
  if (total === 0) return <div className="text-xs text-slate-400 py-10 text-center font-bold">No data available yet.</div>;

  // Map theme colors to light mode
  const getLightColor = (color) => {
    if (color === '#14b8a6') return '#7C5CFF'; // map accent teal to purple
    if (color === '#6366f1') return '#A88BFF'; // indigo to light purple
    if (color === '#a78bfa') return '#C9B7FF'; // lavender to pale lavender
    return color;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 w-full py-4 font-poppins">
      {/* Visual Donut Ring */}
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F3F4F6" strokeWidth="10" />
          {total > 0 && (() => {
            let accumulatedPercent = 0;
            return data.map((item, idx) => {
              const percent = (item.value || 0) / total;
              if (percent === 0) return null;
              
              const strokeLength = 2 * Math.PI * 38;
              const strokeDasharray = `${percent * strokeLength} ${strokeLength}`;
              const strokeDashoffset = -accumulatedPercent * strokeLength;
              accumulatedPercent += percent;

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={getLightColor(item.color)}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            });
          })()}
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-[#1D1D1F]">{total}</span>
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#6B7280]">Logs</span>
        </div>
      </div>

      {/* Legends column */}
      <div className="flex-1 w-full space-y-2 text-left">
        {data.map((item, idx) => {
          const count = item.value || 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getLightColor(item.color) }} />
                <span className="text-[#6B7280] font-bold">{item.name}</span>
              </div>
              <span className="font-extrabold text-[#1D1D1F]">
                {count} <span className="text-gray-400 font-normal">({percent}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. MONTHLY ANALYTICS (Bar Chart)
export const MonthlyAnalytics = ({ data = [] }) => {
  const hasData = data && data.length > 0 && data.some(item => item.wellnessScore > 0);
  if (!hasData) return <div className="text-xs text-slate-400 py-20 text-center font-bold">No data available yet.</div>;

  const width = 450;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 25, left: 30 };

  const barWidth = 32;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return (
    <div className="relative w-full">
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C5CFF" />
            <stop offset="100%" stopColor="#A88BFF" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = padding.top + chartHeight - (val / 100) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text x={padding.left - 8} y={y + 3} fill="#6B7280" className="text-[9px] font-bold" textAnchor="end">
                {val}%
              </text>
            </g>
          );
        })}

        {/* Vertical Bars */}
        {data.map((item, idx) => {
          const x = padding.left + (idx * chartWidth) / (data.length || 1) + (chartWidth / data.length - barWidth) / 2;
          const score = item.wellnessScore || 0;
          const barHeight = (score / 100) * chartHeight;
          const y = padding.top + chartHeight - barHeight;

          return (
            <g key={idx} className="group">
              <motion.rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill="url(#barGlow)"
                initial={{ height: 0, y: padding.top + chartHeight }}
                animate={{ height: barHeight, y }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                className="hover:opacity-90 transition-opacity cursor-pointer"
              />
              {/* Tooltip on hover */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                fill="#7C5CFF"
                className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                textAnchor="middle"
              >
                {score}%
              </text>
              {/* X-axis labels */}
              <text
                x={x + barWidth / 2}
                y={height - 6}
                fill="#6B7280"
                className="text-[10px] font-bold"
                textAnchor="middle"
              >
                {item.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// 4. CALENDAR HEATMAP (Weekly progress blocks)
export const CalendarHeatmap = ({ data = [] }) => {
  const cols = 15;
  const rows = 7;
  
  const dataMap = new Map(data.map((item) => [item.date, item.count]));
  const daysLabel = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  const cells = [];
  const today = new Date();

  // Generate date grid starting from 15 weeks ago
  const startDate = new Date();
  startDate.setDate(today.getDate() - (cols * 7) + 1);
  const dayOffset = startDate.getDay();
  const alignDays = dayOffset === 0 ? 6 : dayOffset - 1;
  startDate.setDate(startDate.getDate() - alignDays);

  for (let c = 0; c < cols; c++) {
    const colCells = [];
    for (let r = 0; r < rows; r++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + (c * 7) + r);
      const dateStr = cellDate.toISOString().split('T')[0];

      const count = dataMap.get(dateStr) || 0;
      colCells.push({ date: dateStr, count });
    }
    cells.push(colCells);
  }

  const getColorClass = (count) => {
    switch (count) {
      case 0: return 'bg-gray-100 border border-gray-200/50';
      case 1: return 'bg-[#7C5CFF]/15 border border-[#7C5CFF]/10';
      case 2: return 'bg-[#7C5CFF]/35 border border-[#7C5CFF]/20';
      case 3: return 'bg-[#7C5CFF]/60 border border-[#7C5CFF]/30';
      case 4:
      default: return 'bg-[#7C5CFF] border border-[#7C5CFF]/45';
    }
  };

  return (
    <div className="flex gap-3 items-start justify-center py-2 overflow-x-auto w-full select-none">
      {/* Y Axis Days */}
      <div className="flex flex-col justify-between h-[96px] text-[8px] font-bold text-slate-400 leading-none pt-1 shrink-0">
        {daysLabel.map((lbl, i) => (
          <span key={i} className="h-2 flex items-center justify-end w-6">{lbl}</span>
        ))}
      </div>

      {/* Grid columns */}
      <div className="flex gap-1.5 flex-1 max-w-sm justify-between">
        {cells.map((col, cIdx) => (
          <div key={cIdx} className="flex flex-col gap-1.5">
            {col.map((cell, rIdx) => (
              <div
                key={rIdx}
                className={`w-2.5 h-2.5 rounded-sm transition-all duration-350 ${getColorClass(cell.count)}`}
                title={`${cell.date}: Level ${cell.count}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
