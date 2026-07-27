import { render, screen } from '@testing-library/react';
import { StatusIcon } from './StatusIcon';

describe('StatusIcon', () => {
  it('renders a visually distinct icon for each status variant', () => {
    const { rerender } = render(<StatusIcon variant="success" />);
    expect(screen.getByTestId('status-icon')).toHaveAttribute('data-variant', 'success');
    expect(screen.getByTestId('status-icon').className).toMatch(/green/);

    rerender(<StatusIcon variant="error" />);
    expect(screen.getByTestId('status-icon')).toHaveAttribute('data-variant', 'error');
    expect(screen.getByTestId('status-icon').className).toMatch(/red/);

    rerender(<StatusIcon variant="pending" />);
    expect(screen.getByTestId('status-icon')).toHaveAttribute('data-variant', 'pending');
    expect(screen.getByTestId('status-icon').className).toMatch(/gray/);
  });
});
