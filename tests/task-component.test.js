import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from "../../axios";
import "./tasks.css";
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';

// Mock Axios
jest.mock('../../axios');

describe('Tasks Component', () => {
  const mockTasks = [
    {
      TASK_ID: 1,
      TASK_NAME: 'Sample Task 1',
      TASK_DESCRIPTION: 'Sample Description 1',
      TASK_SCHEDULE: '2024-12-02 12:00:00',
      NOTIFICATION: 'email',
    },
    {
      TASK_ID: 2,
      TASK_NAME: 'Sample Task 2',
      TASK_DESCRIPTION: 'Sample Description 2',
      TASK_SCHEDULE: '2024-12-02 13:00:00',
      NOTIFICATION: 'phone',
    },
  ];

  beforeEach(() => {
    axios.get.mockResolvedValueOnce({ data: mockTasks });
  });

  test('renders tasks fetched from API', async () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    );

    expect(await screen.findByText('Sample Task 1')).toBeInTheDocument();
    expect(await screen.findByText('Sample Task 2')).toBeInTheDocument();
  });

  test('shows a message when there are no tasks', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(
        'Your Task list is empty, please add tasks using the Create New Task button.'
      )
    ).toBeInTheDocument();
  });

  test('creates a new task', async () => {
    const newTask = {
      TASK_ID: 3,
      TASK_NAME: 'New Task',
      TASK_DESCRIPTION: 'New Description',
      TASK_SCHEDULE: '2024-12-03 12:00:00',
      NOTIFICATION: 'push',
    };
    axios.post.mockResolvedValueOnce({ data: newTask });

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Create New Task'));

    fireEvent.change(screen.getByPlaceholderText('Task Name'), {
      target: { value: 'New Task' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'New Description' },
    });
    fireEvent.click(screen.getByText('Create Task'));

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('New Task')).toBeInTheDocument();
  });

  test('edits a task', async () => {
    axios.put.mockResolvedValueOnce({
      data: {
        ...mockTasks[0],
        TASK_NAME: 'Updated Task 1',
      },
    });

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    );

    await screen.findByText('Sample Task 1');
    fireEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);

    fireEvent.change(screen.getByPlaceholderText('Edit Task name'), {
      target: { value: 'Updated Task 1' },
    });
    fireEvent.click(screen.getByText('Edit Task'));

    await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Updated Task 1')).toBeInTheDocument();
  });

  test('deletes a task', async () => {
    axios.delete.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    );

    await screen.findByText('Sample Task 1');
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Sample Task 1')).not.toBeInTheDocument();
  });
});
