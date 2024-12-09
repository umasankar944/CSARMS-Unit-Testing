import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Register from '../components/Register'; // Update the path to match your file structure
import AppContext from '../Context/AppContext';
import { userRegister } from '../../services/auth-service';

jest.mock('../../services/auth-service', () => ({
  userRegister: jest.fn(),
}));

describe('Register Component', () => {
  const mockSetAuth = jest.fn();
  const mockHandleAccessToken = jest.fn();

  const renderWithContext = () => {
    return render(
      <Router>
        <AppContext.Provider
          value={{
            setAuth: mockSetAuth,
            handleAccessToken: mockHandleAccessToken,
          }}
        >
          <ToastContainer />
          <Register />
        </AppContext.Provider>
      </Router>
    );
  };

  it('renders the form fields', () => {
    renderWithContext();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/User Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  it('handles form input correctly', () => {
    renderWithContext();
    const firstNameInput = screen.getByLabelText(/First Name/i);
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    expect(firstNameInput.value).toBe('John');
  });

  it('calls `userRegister` and displays success message on successful registration', async () => {
    userRegister.mockResolvedValue({
      status: 201,
      token: 'mock-token',
    });

    renderWithContext();

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/User Name/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText(/Register/i));

    await waitFor(() => {
      expect(userRegister).toHaveBeenCalledWith({
        username: 'johndoe',
        password: 'password123',
        email: 'john.doe@example.com',
        firstname: 'John',
        lastname: 'Doe',
        phone: '1234567890',
      });
      expect(mockSetAuth).toHaveBeenCalledWith(true);
    });

    expect(screen.getByText(/Registration successful!/i)).toBeInTheDocument();
  });

  it('shows error message when username already exists', async () => {
    userRegister.mockResolvedValue({ status: 203 });

    renderWithContext();

    fireEvent.change(screen.getByLabelText(/User Name/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText(/Register/i));

    await waitFor(() => {
      expect(screen.getByText(/User name already exists/i)).toBeInTheDocument();
    });
  });

  it('shows error message on registration failure', async () => {
    userRegister.mockRejectedValue(new Error('Registration failed'));

    renderWithContext();

    fireEvent.change(screen.getByLabelText(/User Name/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText(/Register/i));

    await waitFor(() => {
      expect(screen.getByText(/Registration failed. Please check your details and try again./i)).toBeInTheDocument();
    });
  });
});
