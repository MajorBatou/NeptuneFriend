import { degreesToCompass, getBeaufortDescription } from '@/utils/sailing';
import type { WindData } from '@/types';
import styles from './WindRose.module.css';

const BEAUFORT_COLORS: Record<number, string> = {
  0: '#e2e8f0',
  1: '#bfdbfe',
  2: '#93c5fd',
  3: '#60a5fa',
  4: '#22c55e',
  5: '#86efac',
  6: '#fbbf24',
  7: '#f97316',
  8: '#ef4444',
  9: '#dc2626',
  10: '#991b1b',
  11: '#7f1d1d',
  12: '#450a0a',
};

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

interface WindRoseProps {
  wind: WindData;
  size?: number;
  showScale?: boolean;
}

export default function WindRose({ wind, size = 200, showScale = true }: WindRoseProps) {
  const center = size / 2;
  const radius = center - 20;
  const color = BEAUFORT_COLORS[wind.beaufort] ?? '#94a3b8';
  const compass = degreesToCompass(wind.direction);
  const description = getBeaufortDescription(wind.beaufort);

  // Arrow tip and tail
  const arrowLength = radius * 0.65;
  const rad = ((wind.direction - 90) * Math.PI) / 180;
  const tipX = center + arrowLength * Math.cos(rad);
  const tipY = center + arrowLength * Math.sin(rad);
  const tailX = center - arrowLength * 0.5 * Math.cos(rad);
  const tailY = center - arrowLength * 0.5 * Math.sin(rad);

  // Barb perpendicular offsets
  const perpRad = rad + Math.PI / 2;
  const barbSize = 10;
  const b1x = tipX - arrowLength * 0.3 * Math.cos(rad);
  const b1y = tipY - arrowLength * 0.3 * Math.sin(rad);
  const b2x = tipX - arrowLength * 0.55 * Math.cos(rad);
  const b2y = tipY - arrowLength * 0.55 * Math.sin(rad);

  return (
    <div className={styles.wrapper}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Wind rose: ${wind.speed} knots from ${compass}, Beaufort ${wind.beaufort}`}
      >
        {/* Outer ring */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="1" />

        {/* Inner rings */}
        {[0.25, 0.5, 0.75].map((f) => (
          <circle
            key={f}
            cx={center}
            cy={center}
            r={radius * f}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
        ))}

        {/* Cardinal direction labels */}
        {DIRECTIONS.map((dir, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          const labelR = radius + 12;
          const lx = center + labelR * Math.cos(angle);
          const ly = center + labelR * Math.sin(angle);
          return (
            <text
              key={dir}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight={dir === 'N' ? '700' : '400'}
              fill={dir === 'N' ? '#0f172a' : '#94a3b8'}
              fontFamily="var(--font-sans)"
            >
              {dir}
            </text>
          );
        })}

        {/* Cross hairs */}
        <line
          x1={center}
          y1={center - radius}
          x2={center}
          y2={center + radius}
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
        <line
          x1={center - radius}
          y1={center}
          x2={center + radius}
          y2={center}
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />

        {/* Wind arrow shaft */}
        <line
          x1={tailX}
          y1={tailY}
          x2={tipX}
          y2={tipY}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Arrow head */}
        <polygon
          points={`
            ${tipX},${tipY}
            ${tipX - 8 * Math.cos(rad - 0.4)},${tipY - 8 * Math.sin(rad - 0.4)}
            ${tipX - 8 * Math.cos(rad + 0.4)},${tipY - 8 * Math.sin(rad + 0.4)}
          `}
          fill={color}
        />

        {/* Wind barbs for speed indication */}
        {wind.speed >= 10 && (
          <line
            x1={b1x}
            y1={b1y}
            x2={b1x + barbSize * Math.cos(perpRad)}
            y2={b1y + barbSize * Math.sin(perpRad)}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        {wind.speed >= 20 && (
          <line
            x1={b2x}
            y1={b2y}
            x2={b2x + barbSize * Math.cos(perpRad)}
            y2={b2y + barbSize * Math.sin(perpRad)}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {/* Center dot */}
        <circle cx={center} cy={center} r="4" fill={color} />

        {/* Speed label in center */}
        <text
          x={center}
          y={center - 16}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill={color}
          fontFamily="var(--font-sans)"
        >
          {wind.speed}
        </text>
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          fontSize="9"
          fill="#94a3b8"
          fontFamily="var(--font-sans)"
        >
          kts
        </text>
      </svg>

      {showScale && (
        <div className={styles.info}>
          <div className={styles.direction}>{compass}</div>
          <div className={styles.beaufort} style={{ color }}>
            Beaufort {wind.beaufort} — {description}
          </div>
          {wind.gust > wind.speed + 5 && (
            <div className={styles.gust}>Gusts to {wind.gust} kts</div>
          )}
        </div>
      )}
    </div>
  );
}
