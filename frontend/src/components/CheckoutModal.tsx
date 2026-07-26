import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setStep, submitCustomerAndDelivery, updateForm } from '../features/checkout/checkoutSlice';
import { DocumentType } from '../types';
import { detectCardBrand } from '../utils/cardBrand';
import { validateCheckoutForm } from '../utils/checkoutFormValidation';
import type { CheckoutFormErrors } from '../utils/checkoutFormValidation';
import { CardBrandIcon } from './CardBrandIcon';

const inputClasses =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none';
const labelClasses = 'text-xs font-medium text-gray-600';
const errorClasses = 'text-xs text-red-600';

export const CheckoutModal = () => {
  const dispatch = useAppDispatch();
  const { form, submitStatus, submitError } = useAppSelector((state) => state.checkout);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const brand = detectCardBrand(form.cardNumber);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(updateForm({ [field]: event.target.value } as Partial<typeof form>));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateCheckoutForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      void dispatch(submitCustomerAndDelivery(form));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Payment &amp; delivery details</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dispatch(setStep(1))}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-semibold text-gray-800">Card</legend>

            <div>
              <label className={labelClasses} htmlFor="cardHolderName">
                Cardholder name
              </label>
              <input
                id="cardHolderName"
                className={inputClasses}
                value={form.cardHolderName}
                onChange={handleChange('cardHolderName')}
              />
              {errors.cardHolderName && <p className={errorClasses}>{errors.cardHolderName}</p>}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className={labelClasses} htmlFor="cardNumber">
                  Card number
                </label>
                <CardBrandIcon brand={brand} />
              </div>
              <input
                id="cardNumber"
                inputMode="numeric"
                className={inputClasses}
                value={form.cardNumber}
                onChange={handleChange('cardNumber')}
                placeholder="4111 1111 1111 1111"
              />
              {errors.cardNumber && <p className={errorClasses}>{errors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClasses} htmlFor="cardExpMonth">
                  MM
                </label>
                <input
                  id="cardExpMonth"
                  inputMode="numeric"
                  className={inputClasses}
                  value={form.cardExpMonth}
                  onChange={handleChange('cardExpMonth')}
                  placeholder="12"
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="cardExpYear">
                  YYYY
                </label>
                <input
                  id="cardExpYear"
                  inputMode="numeric"
                  className={inputClasses}
                  value={form.cardExpYear}
                  onChange={handleChange('cardExpYear')}
                  placeholder="2030"
                />
              </div>
              <div>
                <label className={labelClasses} htmlFor="cardCvv">
                  CVV
                </label>
                <input
                  id="cardCvv"
                  inputMode="numeric"
                  className={inputClasses}
                  value={form.cardCvv}
                  onChange={handleChange('cardCvv')}
                  placeholder="123"
                />
              </div>
            </div>
            {errors.cardExpMonth && <p className={errorClasses}>{errors.cardExpMonth}</p>}
            {errors.cardCvv && <p className={errorClasses}>{errors.cardCvv}</p>}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-semibold text-gray-800">Delivery</legend>

            <div>
              <label className={labelClasses} htmlFor="fullName">
                Full name
              </label>
              <input
                id="fullName"
                className={inputClasses}
                value={form.fullName}
                onChange={handleChange('fullName')}
              />
              {errors.fullName && <p className={errorClasses}>{errors.fullName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className={inputClasses}
                  value={form.email}
                  onChange={handleChange('email')}
                />
                {errors.email && <p className={errorClasses}>{errors.email}</p>}
              </div>
              <div>
                <label className={labelClasses} htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  className={inputClasses}
                  value={form.phone}
                  onChange={handleChange('phone')}
                />
                {errors.phone && <p className={errorClasses}>{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="documentType">
                  Document type
                </label>
                <select
                  id="documentType"
                  className={inputClasses}
                  value={form.documentType}
                  onChange={(event) =>
                    dispatch(updateForm({ documentType: event.target.value as DocumentType }))
                  }
                >
                  {Object.values(DocumentType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses} htmlFor="documentNumber">
                  Document number
                </label>
                <input
                  id="documentNumber"
                  className={inputClasses}
                  value={form.documentNumber}
                  onChange={handleChange('documentNumber')}
                />
                {errors.documentNumber && <p className={errorClasses}>{errors.documentNumber}</p>}
              </div>
            </div>

            <div>
              <label className={labelClasses} htmlFor="address">
                Address
              </label>
              <input
                id="address"
                className={inputClasses}
                value={form.address}
                onChange={handleChange('address')}
              />
              {errors.address && <p className={errorClasses}>{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses} htmlFor="city">
                  City
                </label>
                <input id="city" className={inputClasses} value={form.city} onChange={handleChange('city')} />
                {errors.city && <p className={errorClasses}>{errors.city}</p>}
              </div>
              <div>
                <label className={labelClasses} htmlFor="region">
                  Region
                </label>
                <input
                  id="region"
                  className={inputClasses}
                  value={form.region}
                  onChange={handleChange('region')}
                />
                {errors.region && <p className={errorClasses}>{errors.region}</p>}
              </div>
            </div>
          </fieldset>

          {submitError && <p className={errorClasses}>{submitError}</p>}

          <button
            type="submit"
            disabled={submitStatus === 'loading'}
            className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-3 font-medium text-white disabled:bg-gray-300"
          >
            {submitStatus === 'loading' ? 'Saving…' : 'Continue to summary'}
          </button>
        </form>
      </div>
    </div>
  );
};
