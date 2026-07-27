import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '../test-utils/renderWithStore';
import type { TestRootState } from '../test-utils/renderWithStore';
import { CheckoutModal } from './CheckoutModal';
import { DocumentType } from '../types';
import { createCustomer } from '../api/customers';
import { createDelivery } from '../api/deliveries';

jest.mock('../api/customers');
jest.mock('../api/deliveries');

const mockedCreateCustomer = createCustomer as jest.MockedFunction<typeof createCustomer>;
const mockedCreateDelivery = createDelivery as jest.MockedFunction<typeof createDelivery>;

const baseState: TestRootState = {
  product: { item: null, status: 'idle', error: null },
  checkout: {
    step: 2,
    form: {
      cardHolderName: '',
      cardNumber: '',
      cardExpMonth: '',
      cardExpYear: '',
      cardCvv: '',
      fullName: '',
      email: '',
      phone: '',
      documentType: DocumentType.CC,
      documentNumber: '',
      address: '',
      city: '',
      region: '',
    },
    customerId: null,
    deliveryId: null,
    deliveryFeeCents: null,
    submitStatus: 'idle',
    submitError: null,
  },
  transaction: { current: null, status: 'idle', error: null },
};

describe('CheckoutModal', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows validation errors when submitting an empty form', async () => {
    renderWithStore(<CheckoutModal />, baseState);

    await userEvent.click(screen.getByRole('button', { name: 'Continue to summary' }));

    expect(await screen.findByText('Card number is invalid')).toBeInTheDocument();
    expect(screen.getByText('Full name is required')).toBeInTheDocument();
    expect(mockedCreateCustomer).not.toHaveBeenCalled();
  });

  it('shows the detected card brand as the user types', async () => {
    renderWithStore(<CheckoutModal />, baseState);

    await userEvent.type(screen.getByLabelText('Card number'), '4111111111111111');

    expect(screen.getByTestId('card-brand-icon')).toHaveTextContent('VISA');
  });

  it('closes the modal and returns to step 1', async () => {
    const { store } = renderWithStore(<CheckoutModal />, baseState);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(store.getState().checkout.step).toBe(1);
  });

  it('submits valid data and advances to the summary step', async () => {
    mockedCreateCustomer.mockResolvedValue({
      id: 'customer-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+573001234567',
      documentType: DocumentType.CC,
      documentNumber: 'AB123456',
    });
    mockedCreateDelivery.mockResolvedValue({
      id: 'delivery-1',
      customerId: 'customer-1',
      address: '123 Main St',
      city: 'Bogota',
      region: 'bogota',
      deliveryFeeCents: 800,
    });

    const { store } = renderWithStore(<CheckoutModal />, baseState);

    await userEvent.type(screen.getByLabelText('Cardholder name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Card number'), '4111111111111111');
    await userEvent.type(screen.getByLabelText('MM'), '12');
    await userEvent.type(screen.getByLabelText('YYYY'), '2099');
    await userEvent.type(screen.getByLabelText('CVV'), '123');
    await userEvent.type(screen.getByLabelText('Full name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Phone'), '+573001234567');
    await userEvent.type(screen.getByLabelText('Document number'), 'AB123456');
    await userEvent.type(screen.getByLabelText('Address'), '123 Main St');
    await userEvent.type(screen.getByLabelText('City'), 'Bogota');
    await userEvent.type(screen.getByLabelText('Region'), 'bogota');

    await userEvent.click(screen.getByRole('button', { name: 'Continue to summary' }));

    await waitFor(() => expect(store.getState().checkout.step).toBe(3));
    expect(store.getState().checkout.customerId).toBe('customer-1');
    expect(store.getState().checkout.deliveryId).toBe('delivery-1');
  });

  it('renders a submit error as a proper alert, not a bare line of text', () => {
    renderWithStore(<CheckoutModal />, {
      ...baseState,
      checkout: { ...baseState.checkout, submitError: 'Could not save your information' },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Could not save your information');
  });
});
