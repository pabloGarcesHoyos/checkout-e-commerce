import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setStep } from '../features/checkout/checkoutSlice';
import { payWithCard } from '../features/transaction/transactionSlice';
import { formatCents } from '../utils/currency';
import { BASE_FEE_CENTS } from '../utils/fees';
import { Alert } from './Alert';
import { Button } from './Button';

export const SummaryBackdrop = () => {
  const dispatch = useAppDispatch();
  const product = useAppSelector((state) => state.product.item);
  const { form, customerId, deliveryId, deliveryFeeCents } = useAppSelector((state) => state.checkout);
  const { status, error } = useAppSelector((state) => state.transaction);

  if (!product || !customerId || !deliveryId || deliveryFeeCents === null) {
    return null;
  }

  const totalCents = product.priceCents + BASE_FEE_CENTS + deliveryFeeCents;

  const handlePay = async () => {
    const result = await dispatch(
      payWithCard({
        productId: product.id,
        customerId,
        deliveryId,
        cardNumber: form.cardNumber,
        cardExpMonth: form.cardExpMonth,
        cardExpYear: form.cardExpYear,
        cardCvv: form.cardCvv,
        cardHolderName: form.cardHolderName,
      }),
    );
    if (payWithCard.fulfilled.match(result)) {
      dispatch(setStep(4));
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order summary</h2>

        <dl className="flex flex-col gap-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <dt>{product.name}</dt>
            <dd>{formatCents(product.priceCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Base fee</dt>
            <dd>{formatCents(BASE_FEE_CENTS)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery fee</dt>
            <dd>{formatCents(deliveryFeeCents)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
            <dt>Total</dt>
            <dd>{formatCents(totalCents)}</dd>
          </div>
        </dl>

        {error && (
          <div className="mt-3">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => dispatch(setStep(2))}>
            Back
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            isLoading={status === 'loading'}
            loadingText="Processing…"
            onClick={() => void handlePay()}
          >
            Pay now
          </Button>
        </div>
      </div>
    </div>
  );
};
