import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Login from "./login";
import AppContext from "../../Context/AppContext";
import { userLogin } from "../../services/auth-service";


jest.mock("../../services/auth-service");

const theme = createTheme();

describe("Login Component", () => {
  const mockSetAuth = jest.fn();
  const mockHandleAccessToken = jest.fn();

  const renderWithProviders = () =>
    render(
      <AppContext.Provider
        value={{
          setAuth: mockSetAuth,
          handleAccessToken: mockHandleAccessToken,
        }}
      >
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <Login />
          </MemoryRouter>
        </ThemeProvider>
      </AppContext.Provider>
    );

  it("renders the login form correctly", () => {
    renderWithProviders();

    // Check if form fields are rendered
    expect(screen.getByLabelText(/User Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
  });

  it("updates input fields when user types", () => {
    renderWithProviders();

    const usernameField = screen.getByLabelText(/User Name/i);
    const passwordField = screen.getByLabelText(/Password/i);

    fireEvent.change(usernameField, { target: { value: "testUser" } });
    fireEvent.change(passwordField, { target: { value: "testPassword" } });

    expect(usernameField.value).toBe("testUser");
    expect(passwordField.value).toBe("testPassword");
  });

  it("calls the login API and handles success", async () => {
    userLogin.mockResolvedValueOnce({
      status: 200,
      token: "mockToken",
    });

    renderWithProviders();

    const usernameField = screen.getByLabelText(/User Name/i);
    const passwordField = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole("button", { name: /Login/i });

    fireEvent.change(usernameField, { target: { value: "testUser" } });
    fireEvent.change(passwordField, { target: { value: "testPassword" } });
    fireEvent.click(loginButton);

    expect(userLogin).toHaveBeenCalledWith({
      username: "testUser",
      password: "testPassword",
    });

    await screen.findByText(/Login successful!/i);

    expect(mockSetAuth).toHaveBeenCalledWith(true);
    expect(mockHandleAccessToken).toHaveBeenCalled();
    expect(window.sessionStorage.getItem("token")).toBe("mockToken");
  });

  it("shows an error message on login failure", async () => {
    userLogin.mockRejectedValueOnce(new Error("Login failed"));

    renderWithProviders();

    const usernameField = screen.getByLabelText(/User Name/i);
    const passwordField = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole("button", { name: /Login/i });

    fireEvent.change(usernameField, { target: { value: "wrongUser" } });
    fireEvent.change(passwordField, { target: { value: "wrongPassword" } });
    fireEvent.click(loginButton);

    await screen.findByText(/Login failed. Please check your credentials and try again./i);

    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockHandleAccessToken).not.toHaveBeenCalled();
  });
});
