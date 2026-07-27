import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { pollTransaction } from '../features/transaction/transactionSlice';
import { setStep } from '../features/checkout/checkoutSlice';
import { Button } from './Button';
import { StatusIcon } from './StatusIcon';
import type { StatusIconVariant } from './StatusIcon';

const TERMINAL_STATUSES = new Set(['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']);
const POLL_INTERVAL_MS = 2500;

const STATUS_COPY: Record<
  string,
  { title: string; description: string; tone: string; icon: StatusIconVariant }
> = {
  PENDING: {
    title: 'Processing payment…',
    description: 'This will only take a moment.',
    tone: 'text-gray-900',
    icon: 'pending',
  },
  APPROVED: {
    title: 'Payment approved',
    description: 'Your order has been confirmed.',
    tone: 'text-green-700',
    icon: 'success',
  },
  DECLINED: {
    title: 'Payment declined',
    description: 'Your card issuer declined this payment.',
    tone: 'text-red-700',
    icon: 'error',
  },
  ERROR: {
    title: 'Something went wrong',
    description: 'We could not process your payment.',
    tone: 'text-red-700',
    icon: 'error',
  },
  VOIDED: {
    title: 'Payment voided',
    description: 'This transaction was voided.',
    tone: 'text-gray-900',
    icon: 'error',
  },
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white p-4 text-center">
      <StatusIcon variant={copy.icon} />
      <h1 className={`text-2xl font-semibold ${copy.tone}`}>{copy.title}</h1>
      <p className="text-sm text-gray-500">{copy.description}</p>
      <p className="text-xs text-gray-400">Reference: {transaction.reference}</p>

      {isFinal && (
        <Button variant="primary" className="mt-4" onClick={() => dispatch(setStep(5))}>
          Back to store
        </Button>
      )}
    </div>
  );
};
