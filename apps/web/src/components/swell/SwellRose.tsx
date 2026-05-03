import type { WaveData } from '@/types';
import styles from './SwellRose.module.css';

interface SwellRoseProps {
  waves: WaveData;
  size?: number;
}

export default function SwellRose({ waves, size = 220 }: SwellRoseProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  const { primarySwell, secondarySwell, confusedSea, swellAngle } = waves;

  function arrowPoints(direction: number, length: number, tipWidth: number) {
    const rad = ((direction - 90) * Math.PI) / 180;
    const perpRad = rad + Math.PI / 2;
    const tipX = cx + length * Math.cos(rad);
    const tipY = cy + length * Math.sin(rad);
    const tailX = cx - length * 0.4 * Math.cos(rad);
    const tailY = cy - length * 0.4 * Math.sin(rad);
    const w = tipWidth;
    return {
      tipX,
      tipY,
      tailX,
      tailY,
      leftX: tipX - length * 0.3 * Math.cos(rad) + w * Math.cos(perpRad),
      leftY: tipY - length * 0.3 * Math.sin(rad) + w * Math.sin(perpRad),
      rightX: tipX - length * 0.3 * Math.cos(rad) - w * Math.cos(perpRad),
      rightY: tipY - length * 0.3 * Math.sin(rad) - w * Math.sin(perpRad),
    };
  }

  const primaryLength = Math.min(r * 0.85, r * (primarySwell.height / 4 + 0.4));
  const pArrow = arrowPoints(primarySwell.direction, primaryLength, 8);

  const secondaryLength = secondarySwell
    ? Math.min(r * 0.7, r * (secondarySwell.height / 4 + 0.3))
    : 0;
  const sArrow = secondarySwell ? arrowPoints(secondarySwell.direction, secondaryLength, 6) : null;

  const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  return (
    <div className={styles.wrapper}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Swell rose: primary ${primarySwell.height}m from ${primarySwell.direction}°${secondarySwell ? `, secondary ${secondarySwell.height}m from ${secondarySwell.direction}°` : ''}`}
      >
        {/* Background rings */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        {[0.33, 0.66].map((f) => (
          <circle
            key={f}
            cx={cx}
            cy={cy}
            r={r * f}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
        ))}

        {/* Confused sea warning arc */}
        {confusedSea && swellAngle !== undefined && (
          <circle
            cx={cx}
            cy={cy}
            r={r * 0.5}
            fill="rgba(239,68,68,0.08)"
            stroke="rgba(239,68,68,0.3)"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}

        {/* Cardinal labels */}
        {DIRECTIONS.map((dir, i) => {
          const angle = (i * 45 - 90) * (Math.PI / 180);
          const lr = r + 13;
          return (
            <text
              key={dir}
              x={cx + lr * Math.cos(angle)}
              y={cy + lr * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="9"
              fontWeight={dir === 'N' ? '700' : '400'}
              fill={dir === 'N' ? '#0f172a' : '#94a3b8'}
              fontFamily="var(--font-sans)"
            >
              {dir}
            </text>
          );
        })}

        {/* Cross hairs */}
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#e2e8f0" strokeWidth="0.5" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#e2e8f0" strokeWidth="0.5" />

        {/* Secondary swell arrow (drawn first so primary is on top) */}
        {sArrow && secondarySwell && (
          <g opacity={0.75}>
            <line
              x1={pArrow.tailX}
              y1={pArrow.tailY}
              x2={sArrow.tailX}
              y2={sArrow.tailY}
              stroke="#f97316"
              strokeWidth="0.5"
              strokeDasharray="3 3"
              opacity={0.4}
            />
            <line
              x1={sArrow.tailX}
              y1={sArrow.tailY}
              x2={sArrow.tipX}
              y2={sArrow.tipY}
              stroke="#f97316"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <polygon
              points={`${sArrow.tipX},${sArrow.tipY} ${sArrow.leftX},${sArrow.leftY} ${sArrow.rightX},${sArrow.rightY}`}
              fill="#f97316"
            />
          </g>
        )}

        {/* Primary swell arrow */}
        <g>
          <line
            x1={pArrow.tailX}
            y1={pArrow.tailY}
            x2={pArrow.tipX}
            y2={pArrow.tipY}
            stroke="#2d7dd2"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <polygon
            points={`${pArrow.tipX},${pArrow.tipY} ${pArrow.leftX},${pArrow.leftY} ${pArrow.rightX},${pArrow.rightY}`}
            fill="#2d7dd2"
          />
        </g>

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill="#0f172a" />

        {/* Height label */}
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#2d7dd2"
          fontFamily="var(--font-sans)"
        >
          {primarySwell.height.toFixed(1)}m
        </text>
        {secondarySwell && (
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            fontSize="10"
            fill="#f97316"
            fontFamily="var(--font-sans)"
          >
            +{secondarySwell.height.toFixed(1)}m
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ background: '#2d7dd2' }} />
          <span>
            Primary {primarySwell.height.toFixed(1)}m / {primarySwell.period}s /{' '}
            {primarySwell.direction}°
          </span>
        </div>
        {secondarySwell && (
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ background: '#f97316' }} />
            <span>
              Secondary {secondarySwell.height.toFixed(1)}m / {secondarySwell.period}s /{' '}
              {secondarySwell.direction}°
            </span>
          </div>
        )}
        {confusedSea && (
          <div
            className={styles.confusedWarning}
            style={
              waves.height < 2.5
                ? {
                    color: '#d97706',
                    background: '#fefce8',
                    borderColor: '#fbbf24',
                  }
                : undefined
            }
          >
            Confused seas — swells {swellAngle?.toFixed(0)}° apart
          </div>
        )}
      </div>
    </div>
  );
}
