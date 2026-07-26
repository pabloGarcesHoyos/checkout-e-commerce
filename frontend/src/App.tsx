import { useAppSelector } from './app/hooks';
import { ProductPage } from './components/ProductPage';
import { CheckoutModal } from './components/CheckoutModal';
import { SummaryBackdrop } from './components/SummaryBackdrop';
import { TransactionStatusScreen } from './components/TransactionStatusScreen';
import { RedirectToProductScreen } from './components/RedirectToProductScreen';

function App() {
  const step = useAppSelector((state) => state.checkout.step);

  return (
    <>
      <ProductPage />
      {step === 2 && <CheckoutModal />}
      {step === 3 && <SummaryBackdrop />}
      {step === 4 && <TransactionStatusScreen />}
      {step === 5 && <RedirectToProductScreen />}
    </>
  );
}

export default App;
