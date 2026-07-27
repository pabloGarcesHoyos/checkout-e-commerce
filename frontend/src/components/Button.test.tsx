import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children and responds to clicks', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Pay now</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Pay now' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('respects an explicit type="submit"', () => {
    render(<Button type="submit">Continue</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('shows a loading state, hides the label, and disables the button', () => {
    render(
      <Button isLoading loadingText="Processing…">
        Pay now
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Processing…')).toBeInTheDocument();
    expect(screen.queryByText('Pay now')).not.toBeInTheDocument();
  });

  it('is disabled when the disabled prop is set even without loading', () => {
    render(<Button disabled>Pay now</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
