import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.history.pushState({}, '', '/');
});

test('renders landing hero heading by default', () => {
  render(<App />);

  const heading = screen.getByRole('heading', {
    name: /welcome/i
  });

  expect(heading).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
});

test('renders about page from the about route', () => {
  window.history.pushState({}, '', '/about-us');

  render(<App />);

  const heading = screen.getByRole('heading', {
    name: /from idea to deployment/i
  });

  expect(heading).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
});

test('renders hidden admin login page from the admin route', () => {
  window.history.pushState({}, '', '/admin/login');

  render(<App />);

  const heading = screen.getByRole('heading', {
    name: /admin login/i
  });

  expect(heading).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /open chat/i })).not.toBeInTheDocument();
});
