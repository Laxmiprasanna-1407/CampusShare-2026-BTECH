import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AdminRoute } from '../components/common/AdminRoute';
import { Navbar } from '../components/common/Navbar';
import * as AuthContextModule from '../context/AuthContext';

describe('Protected Routes and Role-based UI Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects unauthenticated user from protected route to login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    render(
      <MemoryRouter initialEntries={['/my-items']}>
        <Routes>
          <Route path="/login" element={<div>Login Page Redirect Target</div>} />
          <Route
            path="/my-items"
            element={
              <ProtectedRoute>
                <div>Secret Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Redirect Target')).toBeInTheDocument();
    expect(screen.queryByText('Secret Protected Content')).not.toBeInTheDocument();
  });

  it('allows authenticated student to access protected route', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: 1, name: 'Alice Student', role: 'STUDENT' },
    });

    render(
      <MemoryRouter initialEntries={['/my-items']}>
        <Routes>
          <Route
            path="/my-items"
            element={
              <ProtectedRoute>
                <div>Student My Items Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Student My Items Page')).toBeInTheDocument();
  });

  it('shows Admin navigation link to ADMIN users only', () => {
    // Admin user scenario
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      isStudent: false,
      loading: false,
      user: { id: 99, name: 'Campus Admin', role: 'ADMIN' },
    });

    const { unmount } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
    unmount();

    // Regular student scenario
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      isStudent: true,
      loading: false,
      user: { id: 10, name: 'Bob Student', role: 'STUDENT' },
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});
