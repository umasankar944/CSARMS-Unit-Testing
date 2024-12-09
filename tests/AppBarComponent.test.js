import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppBarComponent from './AppBarComponent';
import AppContext from '../../Context/AppContext';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  // useNavigate: () => mockNavigate,
  useNavigate: jest.fn(),
}));

// Mock fetch for password update
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock ToastContainer to prevent actual rendering
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AppBarComponent', () => {
  const mockAuth = { auth: true, setAuth: jest.fn(), fields: { USERNAME: 'testuser' } };

  const renderComponent = () =>
    render(
      <AppContext.Provider value={mockAuth}>
        <MemoryRouter>
          <AppBarComponent />
        </MemoryRouter>
      </AppContext.Provider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders AppBarComponent with user menu', () => {
    renderComponent();
    expect(screen.getByText(/CSARMS/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Open settings/i)).toBeInTheDocument();
  });

  it('opens the user menu on clicking the settings icon', () => {
    renderComponent();

    // Open menu
    const settingsIcon = screen.getByTitle(/Open settings/i);
    fireEvent.click(settingsIcon);

    // Verify menu items
    settings.forEach((setting) => {
      expect(screen.getByText(setting)).toBeInTheDocument();
    });
  });

  it('handles Logout menu click', () => {
    renderComponent();

    // Open menu and click Logout
    fireEvent.click(screen.getByTitle(/Open settings/i));
    fireEvent.click(screen.getByText(/Logout/i));

    // Verify logout behavior
    expect(mockAuth.setAuth).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('opens change password modal on menu click', () => {
    renderComponent();

    // Open menu and click Change Password
    fireEvent.click(screen.getByTitle(/Open settings/i));
    fireEvent.click(screen.getByText(/Change Password/i));

    // Verify modal content
    expect(screen.getByText(/Change Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Old Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
  });

  it('calls the update password API and shows success toast', async () => {
    renderComponent();

    // Open change password modal
    fireEvent.click(screen.getByTitle(/Open settings/i));
    fireEvent.click(screen.getByText(/Change Password/i));

    // Fill password fields
    fireEvent.change(screen.getByLabelText(/Old Password/i), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'newpass' } });

    // Submit update password
    const updateButton = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(updateButton);

    // Assert fetch API was called
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: expect.stringContaining('Bearer'),
      },
      body: JSON.stringify({
        username: 'testuser',
        oldPassword: 'oldpass',
        newPassword: 'newpass',
      }),
    });

    // Verify success toast
    expect(require('react-toastify').toast.success).toHaveBeenCalledWith(
      'Password updated successfully'
    );
  });

  it('handles API error and shows error toast', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('API Error')));
    renderComponent();

    // Open change password modal
    fireEvent.click(screen.getByTitle(/Open settings/i));
    fireEvent.click(screen.getByText(/Change Password/i));

    // Fill password fields
    fireEvent.change(screen.getByLabelText(/Old Password/i), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: 'newpass' } });

    // Submit update password
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    // Verify error toast
    expect(require('react-toastify').toast.error).toHaveBeenCalledWith(
      'Error occurred while updating password'
    );
  });
});
