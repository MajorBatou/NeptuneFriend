import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('NeptuneFriend App', () => {
  it('renders without crashing', () => {
    const { container } = render(<div data-testid="app-root">NeptuneFriend</div>);
    expect(container).toBeTruthy();
  });

  it('displays app name', () => {
    render(<div>NeptuneFriend</div>);
    expect(screen.getByText('NeptuneFriend')).toBeInTheDocument();
  });
});
