import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WindRose from '../components/weather/WindRose';
import TidalFlow from '../components/weather/TidalFlow';
import WeatherStrip from '../components/weather/WeatherStrip';

const mockWind = {
  speed: 15,
  direction: 225,
  gust: 22,
  beaufort: 4,
};

const mockTides = {
  height: 2.3,
  nextHigh: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  nextLow: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
  flow: 'flood' as const,
};

const mockWeather = {
  temperature: 18,
  visibility: 12,
  cloudCover: 40,
  precipitation: 0,
  pressure: 1013,
  humidity: 65,
  description: 'partly cloudy',
  icon: '02d',
};

describe('WindRose', () => {
  it('renders with correct aria label', () => {
    render(<WindRose wind={mockWind} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('15 knots')
    );
  });

  it('shows gust warning when gust is high', () => {
    render(<WindRose wind={mockWind} showScale />);
    expect(screen.getByText(/Gusts to 22 kts/)).toBeInTheDocument();
  });

  it('does not show gust when gust is close to speed', () => {
    const wind = { ...mockWind, gust: 17 };
    render(<WindRose wind={wind} showScale />);
    expect(screen.queryByText(/Gusts/)).not.toBeInTheDocument();
  });
});

describe('TidalFlow', () => {
  it('renders flood label correctly', () => {
    render(<TidalFlow tides={mockTides} />);
    expect(screen.getByText('Flooding')).toBeInTheDocument();
  });

  it('renders ebb label correctly', () => {
    render(<TidalFlow tides={{ ...mockTides, flow: 'ebb' }} />);
    expect(screen.getByText('Ebbing')).toBeInTheDocument();
  });

  it('renders slack label correctly', () => {
    render(<TidalFlow tides={{ ...mockTides, flow: 'slack' }} />);
    expect(screen.getByText('Slack')).toBeInTheDocument();
  });

  it('shows tide height', () => {
    render(<TidalFlow tides={mockTides} />);
    expect(screen.getByText('2.3m')).toBeInTheDocument();
  });
});

describe('WeatherStrip', () => {
  it('renders temperature', () => {
    render(<WeatherStrip weather={mockWeather} />);
    expect(screen.getByText('18°C')).toBeInTheDocument();
  });

  it('renders visibility', () => {
    render(<WeatherStrip weather={mockWeather} />);
    expect(screen.getByText('12km')).toBeInTheDocument();
  });

  it('renders weather description', () => {
    render(<WeatherStrip weather={mockWeather} />);
    expect(screen.getByText('partly cloudy')).toBeInTheDocument();
  });

  it('renders all stat labels', () => {
    render(<WeatherStrip weather={mockWeather} />);
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    expect(screen.getByText('Humidity')).toBeInTheDocument();
    expect(screen.getByText('Pressure')).toBeInTheDocument();
  });
});
