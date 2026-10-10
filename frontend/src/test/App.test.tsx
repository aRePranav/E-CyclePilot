import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';

describe('App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the correct E-CyclePilot product title and subtitle', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ status: 'ok', application: 'E-CyclePilot', version: '0.1.0' }),
      } as Response),
    );

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'E-CyclePilot' })).toBeInTheDocument();
    expect(
      screen.getByText('AI-Powered E-Waste Recovery & Circularity Decision Engine'),
    ).toBeInTheDocument();
    expect(screen.getByText('Give Every Device a Smarter Second Life.')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });
  });

  it('renders all six circularity pathways in the overview grid', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ status: 'ok', application: 'E-CyclePilot', version: '0.1.0' }),
      } as Response),
    );

    render(<App />);

    expect(screen.getByText('SPECIAL_HANDLING')).toBeInTheDocument();
    expect(screen.getByText('REUSE')).toBeInTheDocument();
    expect(screen.getByText('REPAIR')).toBeInTheDocument();
    expect(screen.getByText('REFURBISHMENT')).toBeInTheDocument();
    expect(screen.getByText('COMPONENT_RECOVERY')).toBeInTheDocument();
    expect(screen.getByText('FORMAL_RECYCLING')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveClass('online');
    });
  });

  it('handles a successful health response and displays "API online"', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ status: 'ok', application: 'E-CyclePilot', version: '0.1.0' }),
      } as Response),
    );

    render(<App />);

    const indicator = screen.getByTestId('connection-indicator');
    expect(indicator).toHaveTextContent('Checking connection');

    await waitFor(() => {
      expect(indicator).toHaveTextContent('API online');
      expect(indicator).toHaveClass('online');
    });

    expect(screen.getByText(/Connected \(E-CyclePilot v0.1.0\)/i)).toBeInTheDocument();
  });

  it('handles an unavailable backend safely and displays "API unavailable"', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.reject(new Error('Network error / connection refused')),
    );

    render(<App />);

    const indicator = screen.getByTestId('connection-indicator');
    expect(indicator).toHaveTextContent('Checking connection');

    await waitFor(() => {
      expect(indicator).toHaveTextContent('API unavailable');
      expect(indicator).toHaveClass('offline');
    });

    expect(
      screen.getByText(/Service currently unreachable at configured API URL/i),
    ).toBeInTheDocument();
  });

  it('handles non-200 HTTP response safely and displays "API unavailable"', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 503,
      } as Response),
    );

    render(<App />);

    const indicator = screen.getByTestId('connection-indicator');

    await waitFor(() => {
      expect(indicator).toHaveTextContent('API unavailable');
      expect(indicator).toHaveClass('offline');
    });
  });
});
