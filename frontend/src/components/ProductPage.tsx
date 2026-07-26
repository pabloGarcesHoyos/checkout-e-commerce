import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loadFeaturedProduct } from '../features/product/productSlice';
import { setStep } from '../features/checkout/checkoutSlice';
import { formatCents } from '../utils/currency';

export const ProductPage = () => {
  const dispatch = useAppDispatch();
  const { item: product, status } = useAppSelector((state) => state.product);

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(loadFeaturedProduct());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-500">Loading product…</p>
      </div>
    );
  }

  if (status === 'failed' || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-red-600">We could not load the product. Please try again later.</p>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 sm:p-8">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <img src={product.imageUrl} alt={product.name} className="h-56 w-full object-cover" />
        <div className="flex flex-col gap-3 p-5">
          <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-600">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">{formatCents(product.priceCents)}</span>
            <span className="text-sm text-gray-500">{product.stock} in stock</span>
          </div>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => dispatch(setStep(2))}
            className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {outOfStock ? 'Out of stock' : 'Buy now'}
          </button>
        </div>
      </div>
    </div>
  );
};
