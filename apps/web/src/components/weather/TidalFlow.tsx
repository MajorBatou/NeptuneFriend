import { formatTime } from '@/utils/sailing';
import type { TidalData } from '@/types';
import styles from './TidalFlow.module.css';

interface TidalFlowProps {
  tides: TidalData;
  size?: 'sm' | 'md' | 'lg';
}

const FLOW_CONFIG = {
  flood: { label: 'Flooding', color: '#3b82f6', direction: 1, description: 'Rising tide' },
  ebb: { label: 'Ebbing', color: '#f97316', direction: -1, description: 'Falling tide' },
  slack: { label: 'Slack', color: '#94a3b8', direction: 0, description: 'Turn of tide' },
};

export default function TidalFlow({ tides, size = 'md' }: TidalFlowProps) {
  const config = FLOW_CONFIG[tides.flow];
  const svgSize = size === 'sm' ? 80 : size === 'lg' ? 140 : 110;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const r = svgSize * 0.38;

  // Animated wave path
  const waveY = cy + (tides.height - 2) * 12;
  const wavePath = `
    M ${cx - r} ${waveY}
    C ${cx - r * 0.5} ${waveY - 8},
      ${cx + r * 0.5} ${waveY + 8},
      ${cx + r} ${waveY}
  `;

  return (
    <div className={[styles.wrapper, styles[size]].join(' ')}>
      <div className={styles.visual}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          role="img"
          aria-label={`Tidal flow: ${config.label}, height ${tides.height.toFixed(1)}m`}
        >
          {/* Ocean background */}
          <circle cx={cx} cy={cy} r={r} fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1" />

          {/* Wave fill */}
          <clipPath id="circle-clip">
            <circle cx={cx} cy={cy} r={r - 1} />
          </clipPath>
          <rect
            x={cx - r}
            y={waveY}
            width={r * 2}
            height={r * 2}
            fill={config.color}
            opacity="0.2"
            clipPath="url(#circle-clip)"
          />

          {/* Wave line */}
          <path
            d={wavePath}
            fill="none"
            stroke={config.color}
            strokeWidth="2"
            strokeLinecap="round"
            clipPath="url(#circle-clip)"
          />

          {/* Flow arrows */}
          {config.direction !== 0 && (
            <>
              <line
                x1={cx - 12 * config.direction}
                y1={cy}
                x2={cx + 12 * config.direction}
                y2={cy}
                stroke={config.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <polygon
                points={
                  config.direction > 0
                    ? `${cx + 12},${cy} ${cx + 5},${cy - 5} ${cx + 5},${cy + 5}`
                    : `${cx - 12},${cy} ${cx - 5},${cy - 5} ${cx - 5},${cy + 5}`
                }
                fill={config.color}
              />
            </>
          )}

          {/* Height label */}
          <text
            x={cx}
            y={cy + r + 14}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill={config.color}
            fontFamily="var(--font-sans)"
          >
            {tides.height.toFixed(1)}m
          </text>
        </svg>
      </div>

      <div className={styles.data}>
        <div className={styles.flow} style={{ color: config.color }}>
          {config.label}
        </div>
        <div className={styles.description}>{config.description}</div>

        <div className={styles.times}>
          <div className={styles.timeRow}>
            <span className={styles.timeLabel}>Next high</span>
            <span className={styles.timeValue}>{formatTime(tides.nextHigh)}</span>
          </div>
          <div className={styles.timeRow}>
            <span className={styles.timeLabel}>Next low</span>
            <span className={styles.timeValue}>{formatTime(tides.nextLow)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
