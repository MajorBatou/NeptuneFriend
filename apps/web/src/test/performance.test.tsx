import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFound from '../pages/NotFound';
import SkipLink from '../components/ui/SkipLink';
import LoadingPage from '../components/ui/LoadingPage';
import ErrorBoundary from '../components/ui/ErrorBoundary';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NotFound page', () => {
  it('renders 404 heading', () => {
    render(<NotFound />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('has aria-labelledby on main element', () => {
    render(<NotFound />, { wrapper: Wrapper });
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-labelledby', 'not-found-title');
  });

  it('renders navigation buttons', () => {
    render(<NotFound />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });
});

describe('SkipLink', () => {
  it('renders with correct href', () => {
    render(<SkipLink />);
    const link = screen.getByText('Skip to main content');
    expect(link).toHaveAttribute('href', '#main-content');
  });
});

describe('LoadingPage', () => {
  it('renders default loading message', () => {
    render(<LoadingPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingPage message="Loading conditions..." />);
    expect(screen.getByText('Loading conditions...')).toBeInTheDocument();
  });

  it('has role status for screen readers', () => {
    render(<LoadingPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders fallback when child throws', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
