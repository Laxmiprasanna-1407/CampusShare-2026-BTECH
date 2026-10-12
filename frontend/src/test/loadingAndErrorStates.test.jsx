import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { BrowseItemsPage } from '../pages/BrowseItemsPage';
import * as apiModule from '../services/api';

// Buggy component to test ErrorBoundary
function BuggyComponent() {
  throw new Error('Test Component Crashing Intentionally');
}

describe('Loading and Error States Tests', () => {
  it('ErrorBoundary catches rendering crashes and renders friendly recovery UI', () => {
    // Suppress console.error in test output for clean reports
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Test Component Crashing Intentionally/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reload Application/i })
    ).toBeInTheDocument();

    spy.mockRestore();
  });

  it('BrowseItemsPage renders empty state when catalog has no matching items', async () => {
    vi.spyOn(apiModule.itemsApi, 'getCategories').mockResolvedValue({ data: [] });
    vi.spyOn(apiModule.itemsApi, 'search').mockResolvedValue({
      data: { content: [], totalPages: 0, totalElements: 0 },
    });

    render(
      <MemoryRouter>
        <BrowseItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No items matched your query/i)
      ).toBeInTheDocument();
    });
  });
});
