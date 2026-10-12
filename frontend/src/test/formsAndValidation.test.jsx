import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AuthProvider } from '../context/AuthContext';

describe('Forms and Validation Tests', () => {
  it('renders login form and responds to user typing', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/student@campusshare.edu/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitBtn).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: 'test@campusshare.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });

    expect(emailInput.value).toBe('test@campusshare.edu');
    expect(passwordInput.value).toBe('Secret123!');
  });

  it('validates password length on student registration', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </AuthProvider>
    );

    const nameInput = screen.getByPlaceholderText(/Rohan Sharma/i);
    const emailInput = screen.getByPlaceholderText(/rohan@campusshare.edu/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    fireEvent.change(nameInput, { target: { value: 'Test Student' } });
    fireEvent.change(emailInput, { target: { value: 'test.student@campusshare.edu' } });
    // Password shorter than 6 characters
    fireEvent.change(passwordInput, { target: { value: '123' } });

    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/Password must be at least 6 characters long/i)
    ).toBeInTheDocument();
  });
});
