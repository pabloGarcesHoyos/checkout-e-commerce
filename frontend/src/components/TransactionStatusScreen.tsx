import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { pollTransaction } from '../features/transaction/transactionSlice';
import { setStep } from '../features/checkout/checkoutSlice';

const TERMINAL_STATUSES = new Set(['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']);
const POLL_INTERVAL_MS = 2500;

const STATUS_COPY: Record<string, { title: string; description: string; tone: string }> = {
  PENDING: {
    title: 'Processing payment…',
    description: 'This will only take a moment.',
    tone: 'text-gray-600',
  },
  APPROVED: {
    title: 'Payment approved',
    description: 'Your order has been confirmed.',
    tone: 'text-green-600',
  },
  DECLINED: {
    title: 'Payment declined',
    description: 'Your card issuer declined this payment.',
    tone: 'text-red-600',
  },
  ERROR: {
    title: 'Something went wrong',
    description: 'We could not process your payment.',
    tone: 'text-red-600',
  },
  VOIDED: { title: 'Payment voided', description: 'This transaction was voided.', tone: 'text-gray-600' },
};

export const TransactionStatusScreen = () => {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector((state) => state.transaction.current);

  useEffect(() => {
    if (!transaction || TERMINAL_STATUSES.has(transaction.status)) {
      return;
    }
    const intervalId = setInterval(() => {
      void dispatch(pollTransaction(transaction.id));
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [transaction, dispatch]);

  if (!transaction) {
    return null;
  }

  const copy = STATUS_COPY[transaction.status];
  const isFinal = TERMINAL_STATUSES.has(transaction.status);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className={`text-2xl font-semibold ${copy.tone}`}>{copy.title}</h1>
      <p className="text-sm text-gray-500">{copy.description}</p>
      <p className="text-xs text-gray-400">Reference: {transaction.reference}</p>

      {isFinal && (
        <button
          type="button"
          onClick={() => dispatch(setStep(5))}
          className="mt-4 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Back to store
        </button>
      )}
    </div>
  );
};
