import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemDetailPage } from '../pages/ItemDetailPage';
import * as apiModule from '../services/api';
import * as AuthContextModule from '../context/AuthContext';

describe('Rental Amount Preview and Calculations', () => {
  const mockItem = {
    id: 10,
    title: 'Casio fx-991EX Calculator',
    dailyPrice: '30.00',
    deposit: '100.00',
    condition: 'LIKE_NEW',
    category: { name: 'Calculators' },
    owner: { id: 2, name: 'Other Student', email: 'other@campusshare.edu' },
    averageRating: 4.8,
    totalReviews: 5,
    tags: ['Math', 'Exams'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiModule.itemsApi, 'getById').mockResolvedValue({ data: mockItem });
    vi.spyOn(apiModule.reviewsApi, 'getByItem').mockResolvedValue({ data: [] });
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 1, name: 'Current Student', role: 'STUDENT' },
      isAuthenticated: true,
      isAdmin: false,
    });
  });

  it('renders item details and calculates live rental preview for multi-day rental', async () => {
    render(
      <MemoryRouter initialEntries={['/items/10']}>
        <Routes>
          <Route path="/items/:id" element={<ItemDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for item to load
    await waitFor(() => {
      expect(screen.getByText('Casio fx-991EX Calculator')).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText(/Rental Start Date/i);
    const endDateInput = screen.getByLabelText(/Return End Date/i);

    // Set 3-day rental: 2026-11-01 to 2026-11-03 inclusive (3 days @ ₹30.00 = ₹90.00)
    fireEvent.change(startDateInput, { target: { value: '2026-11-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-11-03' } });

    expect(screen.getByText(/3 day\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText(/₹90\.00/i)).toBeInTheDocument();
  });
});
