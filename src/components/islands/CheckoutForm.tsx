import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $cart } from '@/stores/cart';
import { product } from '@/data/product';
import { formatPrice } from '@/lib/format';
import { ICONS } from '@/lib/icons';
import { validateCheckoutForm, type CheckoutFormData, type CheckoutFormField } from '@/lib/checkout/validation';
import type { ProductCommerce } from '@/lib/shopify/types';

interface CheckoutFormProps { commerce: ProductCommerce }

const SUMUP_SDK_URL = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';
const WIDGET_CONTAINER_ID = 'sumup-card';

const EMPTY_FORM: CheckoutFormData = {
  email: '',
  phone: '',
  address: {
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    provinceCode: '',
    countryCode: 'ES',
    zip: '',
  },
};

const FIELD_ORDER: CheckoutFormField[] = [
  'email',
  'phone',
  'address.firstName',
  'address.lastName',
  'address.address1',
  'address.zip',
  'address.city',
  'address.countryCode',
];

type SumUpResponseType = 'sent' | 'invalid' | 'auth-screen' | 'error' | 'success' | 'fail';
interface SumUpCardInstance { unmount?: () => void }

declare global {
  interface Window {
    SumUpCard?: {
      mount: (options: {
        checkoutId: string;
        id: string;
        onResponse: (type: SumUpResponseType, body: unknown) => void;
      }) => SumUpCardInstance;
    };
  }
}

let sumUpScriptPromise: Promise<void> | null = null;

function loadSumUpScript(): Promise<void> {
  if (typeof window === 'undefined' || window.SumUpCard) return Promise.resolve();
  if (sumUpScriptPromise) return sumUpScriptPromise;
  sumUpScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SUMUP_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el widget de pago de SumUp.'));
    document.head.appendChild(script);
  });
  return sumUpScriptPromise;
}

type Phase = 'form' | 'creating-session' | 'widget' | 'processing';

export function CheckoutForm({ commerce }: CheckoutFormProps) {
  const cart = useStore($cart);
  const [form, setForm] = useState<CheckoutFormData>(EMPTY_FORM);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const widgetInstance = useRef<SumUpCardInstance | undefined>(undefined);
  const paymentRef = useRef<HTMLElement>(null);

  const validation = useMemo(() => validateCheckoutForm(form), [form]);
  const fieldErrors = attemptedSubmit && !validation.valid ? validation.errors : {};
  const line = cart?.line ?? null;
  const variant = line ? commerce.variants.find((item) => item.id === line.variantId) : undefined;
  const unsupportedCurrency = commerce.currencyCode !== 'EUR';
  const hasFreeShipping = Boolean(
    cart && product.shipping.freeOverCents !== null && cart.totalCents >= product.shipping.freeOverCents,
  );

  function invalidatePaymentSession(): void {
    if (!checkoutId) return;
    setCheckoutId(null);
    setRef(null);
    setPhase('form');
    setErrorMessage(null);
  }

  function updateField(field: 'email' | 'phone', value: string): void {
    invalidatePaymentSession();
    setForm((previous: CheckoutFormData) => ({ ...previous, [field]: value }));
  }

  function updateAddressField(field: keyof CheckoutFormData['address'], value: string): void {
    invalidatePaymentSession();
    setForm((previous: CheckoutFormData) => ({
      ...previous,
      address: { ...previous.address, [field]: value },
    }));
  }

  function focusFirstError(): void {
    if (validation.valid) return;
    const first = FIELD_ORDER.find((field) => validation.errors[field]);
    if (!first) return;
    requestAnimationFrame(() => document.getElementById(`checkout-${first.replace('.', '-')}`)?.focus());
  }

  async function preparePayment(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAttemptedSubmit(true);
    setErrorMessage(null);
    if (!validation.valid) {
      focusFirstError();
      return;
    }
    if (!cart || !line) return;

    setPhase('creating-session');
    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: cart.id, email: form.email, phone: form.phone, address: form.address }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === 'validation') {
          setErrorMessage('No pudimos validar uno de los campos. Revísalo e intenta de nuevo.');
        } else if (body?.error === 'empty_cart') {
          setErrorMessage('Tu carrito está vacío. Vuelve a la tienda para añadir productos.');
        } else if (body?.error === 'bad_request') {
          setErrorMessage('El pedido enviado no es válido. Recarga la página e intenta de nuevo.');
        } else {
          setErrorMessage('No pudimos iniciar el pago por un problema del servidor. Intenta de nuevo en unos minutos.');
        }
        setPhase('form');
        return;
      }

      const data = (await response.json()) as { ref: string; checkoutId: string };
      setRef(data.ref);
      setCheckoutId(data.checkoutId);
      setPhase('widget');
      requestAnimationFrame(() => paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch {
      setErrorMessage('No pudimos conectar con el servidor. Comprueba tu conexión e intenta de nuevo.');
      setPhase('form');
    }
  }

  function handleWidgetResponse(type: SumUpResponseType): void {
    switch (type) {
      case 'sent':
      case 'auth-screen':
        setPhase('processing');
        setErrorMessage(null);
        return;
      case 'success':
        if (ref) window.location.assign(`/checkout/gracias?ref=${encodeURIComponent(ref)}`);
        else {
          setPhase('widget');
          setErrorMessage('Tu pago se procesó pero no pudimos confirmarlo automáticamente. Contacta con soporte.');
        }
        return;
      case 'invalid':
        setPhase('widget');
        setErrorMessage('Revisa los datos de tu tarjeta e intenta de nuevo.');
        return;
      case 'fail':
        setPhase('widget');
        setErrorMessage('Tu pago fue rechazado. Puedes intentar con otra tarjeta.');
        return;
      default:
        setPhase('widget');
        setErrorMessage('Ocurrió un error al procesar el pago. Intenta de nuevo.');
    }
  }

  useEffect(() => {
    if ((phase !== 'widget' && phase !== 'processing') || !checkoutId) return;
    let cancelled = false;
    void loadSumUpScript()
      .then(() => {
        if (cancelled || !window.SumUpCard) return;
        widgetInstance.current = window.SumUpCard.mount({
          checkoutId,
          id: WIDGET_CONTAINER_ID,
          onResponse: (type) => handleWidgetResponse(type),
        });
      })
      .catch(() => {
        if (!cancelled) setErrorMessage('No pudimos cargar el widget de pago. Recarga la página e intenta de nuevo.');
      });
    return () => {
      cancelled = true;
      widgetInstance.current?.unmount?.();
      widgetInstance.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retryToken deliberately remounts the provider widget
  }, [checkoutId, retryToken]);

  if (!cart || !line) {
    return (
      <div className="rounded-card bg-white p-5 text-center shadow-card">
        <p className="text-graphite">Tu carrito está vacío.</p>
        <a href="/" className="mt-3 inline-block font-semibold text-grape underline">Volver a la tienda</a>
      </div>
    );
  }

  const orderSummary = (
    <OrderSummary
      variantTitle={variant?.title ?? commerce.title}
      quantity={line.quantity}
      subtotalCents={cart.subtotalCents}
      discountCents={cart.discountCents}
      totalCents={cart.totalCents}
      hasFreeShipping={hasFreeShipping}
    />
  );

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start xl:gap-10">
      <form onSubmit={preparePayment} className="min-w-0 space-y-5" noValidate>
        <section className="rounded-card bg-white p-5 shadow-lift sm:p-6" aria-labelledby="checkout-contact-title">
          <SectionHeading id="checkout-contact-title">Información</SectionHeading>
          <div className="mt-4 space-y-3">
            <Field id="checkout-email" label="Email" required placeholder="correo@ejemplo.com" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(value) => updateField('email', value)} error={fieldErrors.email} />
            <Field id="checkout-phone" label="Teléfono" required placeholder="+34 600 000 000" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(value) => updateField('phone', value)} error={fieldErrors.phone} />
          </div>
        </section>

        <section className="rounded-card bg-white p-5 shadow-lift sm:p-6" aria-labelledby="checkout-shipping-title">
          <SectionHeading id="checkout-shipping-title">Datos de envío</SectionHeading>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
              <Field id="checkout-address-firstName" label="Nombre" required placeholder="Nombre" autoComplete="given-name" value={form.address.firstName} onChange={(value) => updateAddressField('firstName', value)} error={fieldErrors['address.firstName']} />
              <Field id="checkout-address-lastName" label="Apellidos" required placeholder="Apellidos" autoComplete="family-name" value={form.address.lastName} onChange={(value) => updateAddressField('lastName', value)} error={fieldErrors['address.lastName']} />
            </div>
            <Field id="checkout-address-address1" label="Dirección" required placeholder="Calle y número" autoComplete="street-address" value={form.address.address1} onChange={(value) => updateAddressField('address1', value)} error={fieldErrors['address.address1']} />
            <Field id="checkout-address-address2" label="Piso / puerta" optionalHint autoComplete="address-line2" value={form.address.address2} onChange={(value) => updateAddressField('address2', value)} />
            <div className="grid grid-cols-1 gap-3 xs:grid-cols-[0.7fr_1fr_1fr]">
              <Field id="checkout-address-zip" label="C.P." required placeholder="28001" autoComplete="postal-code" inputMode="numeric" value={form.address.zip} onChange={(value) => updateAddressField('zip', value)} error={fieldErrors['address.zip']} />
              <Field id="checkout-address-city" label="Ciudad" required placeholder="Madrid" autoComplete="address-level2" value={form.address.city} onChange={(value) => updateAddressField('city', value)} error={fieldErrors['address.city']} />
              <Field id="checkout-address-provinceCode" label="Provincia" optionalHint placeholder="Madrid" autoComplete="address-level1" value={form.address.provinceCode} onChange={(value) => updateAddressField('provinceCode', value)} />
            </div>
            <Field id="checkout-address-countryCode" label="País (código)" required placeholder="ES" autoComplete="country" value={form.address.countryCode} onChange={(value) => updateAddressField('countryCode', value.toUpperCase())} error={fieldErrors['address.countryCode']} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-steel">
            {hasFreeShipping && <TrustItem icon="truck">Envío gratis a España</TrustItem>}
            <TrustItem icon="clock">{product.shipping.etaLabel}</TrustItem>
          </div>
        </section>

        <section ref={paymentRef} className="scroll-mt-5 rounded-card bg-white p-5 shadow-lift sm:p-6" aria-labelledby="checkout-payment-title">
          <SectionHeading id="checkout-payment-title">Método de pago</SectionHeading>
          <div className="min-h-10" aria-hidden="true" />

          <div className="mt-5 xl:hidden">
            <h3 className="mb-3 font-display text-sm font-bold text-graphite">Tu pedido ({cart.totalQuantity})</h3>
            {orderSummary}
          </div>

          {unsupportedCurrency ? (
            <Alert>El pago con tarjeta no está disponible para esta moneda en este momento.</Alert>
          ) : (
            <>
              {errorMessage && <div className="mt-4"><Alert>{errorMessage}</Alert></div>}
              {phase === 'processing' && <p className="mt-4 text-center text-sm text-steel" aria-live="polite">Procesando tu pago…</p>}
              {(phase === 'widget' || phase === 'processing') && <div id={WIDGET_CONTAINER_ID} className="mt-5" />}
              {phase === 'form' || phase === 'creating-session' ? (
                <button type="submit" disabled={phase === 'creating-session'} className="mt-5 flex h-12 w-full items-center justify-center rounded-pill bg-grape px-6 font-display text-sm font-bold tracking-wide text-white shadow-lift transition active:scale-[.99] hover:bg-grape-dark disabled:cursor-not-allowed disabled:opacity-60">
                  {phase === 'creating-session' ? 'Preparando el pago…' : `Continuar al pago seguro · ${formatPrice(cart.totalCents)}`}
                </button>
              ) : errorMessage ? (
                <button type="button" onClick={() => setRetryToken((token: number) => token + 1)} className="mt-3 w-full rounded-pill border-2 border-graphite/15 px-6 py-3 font-display text-sm font-bold text-graphite transition hover:bg-graphite/5">Reintentar</button>
              ) : null}
              <TrustSignals hasFreeShipping={hasFreeShipping} />
            </>
          )}
        </section>
      </form>

      <aside className="sticky top-8 hidden rounded-card bg-white p-5 shadow-lift xl:-mt-16 xl:block" aria-label="Resumen del pedido">
        <h2 className="mb-4 font-display text-base font-bold text-graphite">Tu pedido ({cart.totalQuantity})</h2>
        {orderSummary}
      </aside>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="font-display text-sm font-extrabold uppercase tracking-[0.08em] text-graphite">{children}</h2>;
}

function OrderSummary({ variantTitle, quantity, subtotalCents, discountCents, totalCents, hasFreeShipping }: { variantTitle: string; quantity: number; subtotalCents: number; discountCents: number; totalCents: number; hasFreeShipping: boolean }) {
  return (
    <div className="text-sm">
      <div className="flex items-start justify-between gap-4 border-b border-graphite/10 pb-3">
        <p className="font-display font-bold text-graphite">{product.name} <span className="font-sans font-normal text-steel">· {variantTitle} × {quantity}</span></p>
        <span className="shrink-0 tabular-nums font-semibold text-graphite">{formatPrice(totalCents)}</span>
      </div>
      <dl className="space-y-2 pt-3">
        {discountCents > 0 && <><div className="flex justify-between gap-3"><dt className="text-steel">Subtotal</dt><dd className="tabular-nums text-graphite">{formatPrice(subtotalCents)}</dd></div><div className="flex justify-between gap-3"><dt className="text-steel">Descuento</dt><dd className="tabular-nums font-semibold text-gold">−{formatPrice(discountCents)}</dd></div></>}
        <div className="flex justify-between gap-3"><dt className="text-steel">Envío</dt><dd className={hasFreeShipping ? 'font-semibold text-grape' : 'text-steel'}>{hasFreeShipping ? 'GRATIS' : 'Calculado al finalizar'}</dd></div>
        <div className="flex justify-between gap-3 border-t border-graphite/10 pt-2"><dt className="font-display font-bold text-graphite">Total</dt><dd className="font-display text-lg font-extrabold tabular-nums text-graphite">{formatPrice(totalCents)}</dd></div>
      </dl>
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-tile bg-grape-tint p-3 text-sm text-grape" role="alert">{children}</p>;
}

function TrustItem({ icon, children }: { icon: 'lock' | 'truck' | 'shield' | 'clock'; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5"><svg viewBox={ICONS[icon].viewBox} className="size-3.5 text-grape" aria-hidden="true"><path fill="currentColor" d={ICONS[icon].path} /></svg>{children}</span>;
}

function TrustSignals({ hasFreeShipping }: { hasFreeShipping: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.6875rem] font-medium text-steel">
      <TrustItem icon="lock">Pago seguro</TrustItem>
      {hasFreeShipping && <TrustItem icon="truck">Envío gratis a España</TrustItem>}
      <TrustItem icon="shield">{product.guarantee.title}</TrustItem>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel';
  autoComplete?: string;
  inputMode?: 'email' | 'tel' | 'numeric';
  placeholder?: string;
  required?: boolean;
  optionalHint?: boolean;
  error?: string | undefined;
}

function Field({ id, label, value, onChange, type = 'text', autoComplete, inputMode, placeholder, required = false, optionalHint = false, error }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-graphite">{label}{required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}</label>
      <input id={id} name={id.replace('checkout-', '')} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} inputMode={inputMode} placeholder={placeholder} required={required} aria-required={required || undefined} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : optionalHint ? `${id}-hint` : undefined} className="h-12 w-full rounded-tile border border-graphite/15 bg-white px-3 text-base text-graphite outline-none transition placeholder:text-steel/55 focus-visible:border-grape focus-visible:ring-2 focus-visible:ring-grape/20" />
      {optionalHint && <p id={`${id}-hint`} className="mt-1 text-[0.6875rem] text-steel">Opcional</p>}
      {error && <p id={errorId} className="mt-1 text-xs font-medium text-red-700" role="alert">{error}</p>}
    </div>
  );
}
