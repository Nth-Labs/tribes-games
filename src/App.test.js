import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock(
  'react-router-dom',
  () => ({
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Route: ({ element }) => element,
    Routes: ({ children }) => <>{children}</>,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

test("renders the game library navigation", () => {
  render(<App />);
  expect(screen.getByText(/NthLabs' Game Library/i)).toBeInTheDocument();
  expect(screen.getByText(/Precision Timer/i)).toBeInTheDocument();
});
