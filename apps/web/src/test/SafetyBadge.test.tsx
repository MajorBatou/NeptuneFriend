import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SafetyBadge from '../components/sailing/SafetyBadge';

describe('SafetyBadge', () => {
  it('shows safe label', () => {
    render(<SafetyBadge rating="safe" />);
    expect(screen.getByText('Safe to sail')).toBeInTheDocument();
  });

  it('shows caution label', () => {
    render(<SafetyBadge rating="caution" />);
    expect(screen.getByText('Sail with caution')).toBeInTheDocument();
  });

  it('shows danger label', () => {
    render(<SafetyBadge rating="danger" />);
    expect(screen.getByText('Dangerous conditions')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<SafetyBadge rating="safe" showLabel={false} />);
    expect(screen.queryByText('Safe to sail')).not.toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<SafetyBadge rating="danger" />);
    expect(screen.getByRole('status', { name: 'Dangerous conditions' })).toBeInTheDocument();
  });
});
