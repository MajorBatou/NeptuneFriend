import type { ModelContribution } from '@/types';
import styles from './ModelBadges.module.css';

const MODEL_COLORS: Record<string, string> = {
  ecmwf: '#185FA5',
  ukmo: '#0F6E56',
  icon: '#854F0B',
  gfs: '#7F77DD',
  'open-meteo': '#639922',
  openweather: '#993C1D',
  nam: '#3C3489',
  hrrr: '#712B13',
};

interface ModelBadgesProps {
  models: ModelContribution[];
}

export default function ModelBadges({ models }: ModelBadgesProps) {
  if (!models || models.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Models</span>
      <div className={styles.badges}>
        {models.map((m) => (
          <div
            key={m.model}
            className={styles.badge}
            style={{
              backgroundColor: `${MODEL_COLORS[m.model] ?? '#888780'}18`,
              color: MODEL_COLORS[m.model] ?? '#888780',
              borderColor: `${MODEL_COLORS[m.model] ?? '#888780'}44`,
            }}
            title={`${m.model.toUpperCase()} — ${m.weight}% weight`}
          >
            <span className={styles.modelName}>{m.model.toUpperCase()}</span>
            <span className={styles.modelWeight}>{m.weight}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
