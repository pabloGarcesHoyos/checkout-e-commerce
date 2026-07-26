import { useEffect } from 'react';
import { useAppDispatch } from '../app/hooks';
import { loadFeaturedProduct } from '../features/product/productSlice';
import { resetCheckout } from '../features/checkout/checkoutSlice';
import { resetTransaction } from '../features/transaction/transactionSlice';

export const RedirectToProductScreen = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(loadFeaturedProduct()).then(() => {
      dispatch(resetTransaction());
      dispatch(resetCheckout());
    });
  }, [dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <p className="text-gray-500">Redirecting…</p>
    </div>
  );
};
