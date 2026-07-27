import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders the message with an alert role', () => {
    render(<Alert variant="error">Request failed with status code 422</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent('Request failed with status code 422');
  });

  it('applies distinct styling per variant', () => {
    const { rerender } = render(<Alert variant="error">Something failed</Alert>);
    expect(screen.getByRole('alert').className).toMatch(/red/);

    rerender(<Alert variant="success">All good</Alert>);
    expect(screen.getByRole('alert').className).toMatch(/green/);

    rerender(<Alert variant="warning">Careful</Alert>);
    expect(screen.getByRole('alert').className).toMatch(/amber/);
  });
});
