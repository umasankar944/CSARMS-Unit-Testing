import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Categories from "./categories.css";
import axios from "../../axios";
import { MemoryRouter } from "react-router-dom";

// Mock axios
jest.mock("../../axios");

const mockCategories = [
  {
    CATEGORYID: "1",
    CATEGORYNAME: "Category 1",
    CATEGORYDESCRIPTION: "Description 1",
  },
  {
    CATEGORYID: "2",
    CATEGORYNAME: "Category 2",
    CATEGORYDESCRIPTION: "Description 2",
  },
];

describe("Categories Component", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockCategories });
    axios.post.mockResolvedValue({});
    axios.put.mockResolvedValue({});
    axios.delete.mockResolvedValue({});
  });

  it("renders the category list", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Wait for the categories to load
    await waitFor(() => {
      expect(screen.getByText("Category 1")).toBeInTheDocument();
      expect(screen.getByText("Category 2")).toBeInTheDocument();
    });
  });

  it("opens and closes the Create Category modal", () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const createButton = screen.getByText("Create New Category");
    fireEvent.click(createButton);

    expect(screen.getByText("Create New Category")).toBeInTheDocument();

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    expect(screen.queryByText("Create New Category")).not.toBeInTheDocument();
  });

  it("creates a new category", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Create New Category"));

    const nameInput = screen.getByPlaceholderText("Category Name");
    const descInput = screen.getByPlaceholderText("Description");
    const createButton = screen.getByText("Create Category");

    fireEvent.change(nameInput, { target: { value: "New Category" } });
    fireEvent.change(descInput, { target: { value: "New Description" } });
    fireEvent.click(createButton);

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post).toHaveBeenCalledWith("http://localhost:5000/categories", {
      name: "New Category",
      description: "New Description",
    });
  });

  it("deletes a category", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Category 1")).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByRole("button").find((btn) => btn.textContent === "Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => expect(axios.delete).toHaveBeenCalled());
    expect(axios.delete).toHaveBeenCalledWith("http://localhost:5000/categories/1");
  });

  it("opens the edit modal with correct data", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Category 1")).toBeInTheDocument();
    });

    const editButton = screen.getAllByRole("button").find((btn) => btn.textContent === "Edit");
    fireEvent.click(editButton);

    expect(screen.getByPlaceholderText("Edit category name").value).toBe("Category 1");
    expect(screen.getByPlaceholderText("Edit description").value).toBe("Description 1");
  });

  it("updates a category", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Category 1")).toBeInTheDocument();
    });

    const editButton = screen.getAllByRole("button").find((btn) => btn.textContent === "Edit");
    fireEvent.click(editButton);

    const nameInput = screen.getByPlaceholderText("Edit category name");
    const descInput = screen.getByPlaceholderText("Edit description");
    const editSubmitButton = screen.getByText("Edit Category");

    fireEvent.change(nameInput, { target: { value: "Updated Category" } });
    fireEvent.change(descInput, { target: { value: "Updated Description" } });
    fireEvent.click(editSubmitButton);

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(axios.put).toHaveBeenCalledWith("http://localhost:5000/categories/1", {
      name: "Updated Category",
      description: "Updated Description",
    });
  });

  it("navigates to the tasks page", async () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Category 1")).toBeInTheDocument();
    });

    const viewTasksButton = screen.getAllByText("View Tasks")[0];
    fireEvent.click(viewTasksButton);

    expect(global.window.location.pathname).toBe("/tasks/1");
  });
});
