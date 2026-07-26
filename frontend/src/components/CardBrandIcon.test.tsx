import { render, screen } from '@testing-library/react';
import { CardBrandIcon } from './CardBrandIcon';

describe('CardBrandIcon', () => {
  it('renders the Visa label', () => {
    render(<CardBrandIcon brand="visa" />);
    expect(screen.getByTestId('card-brand-icon')).toHaveTextContent('VISA');
  });

  it('renders the Mastercard label', () => {
    render(<CardBrandIcon brand="mastercard" />);
    expect(screen.getByTestId('card-brand-icon')).toHaveTextContent('MC');
  });

  it('renders a placeholder for an unknown brand', () => {
    render(<CardBrandIcon brand="unknown" />);
    expect(screen.getByTestId('card-brand-icon')).toHaveTextContent('—');
  });
});
