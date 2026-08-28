import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cartCreate: vi.fn(),
  cartLinesAdd: vi.fn(),
  cartLinesUpdate: vi.fn(),
  cartGet: vi.fn(),
}));

vi.mock('@/lib/shopify/cart', () => mocks);
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn(), centsToUnits: (c: number) => c / 100 }));

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => void (store[k] = v),
  removeItem: (k: string) => void delete store[k],
});

const { $cart, syncCartLine, revalidateCartPricing } = await import('@/stores/cart');

const snapshot = (totalCents: number, quantity: number) => ({
  id: 'gid://shopify/Cart/abc',
  checkoutUrl: 'https://example.test/checkout',
  totalQuantity: quantity,
  subtotalCents: totalCents,
  totalCents,
  discountCents: 0,
  line: { id: 'gid://shopify/CartLine/1', variantId: 'v1', quantity },
});

describe('syncCartLine — stale automatic-discount recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(mocks).forEach((m) => m.mockReset());
    $cart.set(snapshot(1350, 1));
  });

  async function flush(promise: Promise<void>) {
    await vi.advanceTimersByTimeAsync(500);
    await promise;
  }

  // Shopify only evaluates automatic discounts at cart CREATION. A cart that
  // predates a discount keeps stale totals through every cartLinesUpdate, so
  // the store recreates it when Shopify disagrees with the catalog projection.
  it('recreates the cart when the updated total does not match the projection', async () => {
    mocks.cartLinesUpdate.mockResolvedValue(snapshot(2700, 2)); // carrito viejo, sin descuento
    mocks.cartCreate.mockResolvedValue(snapshot(2566, 2)); // recreado, Shopify aplica el 5%

    await flush(syncCartLine('v1', 2, 2566));

    expect(mocks.cartLinesUpdate).toHaveBeenCalledOnce();
    expect(mocks.cartCreate).toHaveBeenCalledWith('v1', 2);
    expect($cart.get()?.totalCents).toBe(2566);
  });

  it('no recrea nada cuando Shopify ya coincide con la proyección', async () => {
    mocks.cartLinesUpdate.mockResolvedValue(snapshot(2566, 2));

    await flush(syncCartLine('v1', 2, 2566));

    expect(mocks.cartCreate).not.toHaveBeenCalled();
    expect($cart.get()?.totalCents).toBe(2566);
  });

  it('acepta el total de Shopify aunque el carrito recreado siga difiriendo', async () => {
    mocks.cartLinesUpdate.mockResolvedValue(snapshot(2700, 2));
    mocks.cartCreate.mockResolvedValue(snapshot(2700, 2));

    await flush(syncCartLine('v1', 2, 2566));

    expect(mocks.cartCreate).toHaveBeenCalledOnce(); // una sola vez, sin bucle
    expect($cart.get()?.totalCents).toBe(2700);
  });

  it('omite la comprobación cuando no se pasa proyección', async () => {
    mocks.cartLinesUpdate.mockResolvedValue(snapshot(2700, 2));

    await flush(syncCartLine('v1', 2));

    expect(mocks.cartCreate).not.toHaveBeenCalled();
  });
});

describe('revalidateCartPricing — carrito rehidratado con precio obsoleto', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(mocks).forEach((m) => m.mockReset());
    store['oil-sprayer:cartId'] = 'gid://shopify/Cart/abc';
  });

  it('descarta el carrito viejo y lo recrea cuando el total no coincide', async () => {
    $cart.set(snapshot(2700, 2));
    mocks.cartCreate.mockResolvedValue(snapshot(2566, 2));

    revalidateCartPricing(2566);
    // El id se descarta de inmediato para que la sync tome el camino de create.
    expect($cart.get()).toBeNull();

    await vi.advanceTimersByTimeAsync(500);
    expect(mocks.cartCreate).toHaveBeenCalledWith('v1', 2);
    expect(mocks.cartLinesUpdate).not.toHaveBeenCalled();
    expect($cart.get()?.totalCents).toBe(2566);
  });

  it('no toca nada cuando el carrito ya coincide con el catálogo', async () => {
    $cart.set(snapshot(2566, 2));

    revalidateCartPricing(2566);

    await vi.advanceTimersByTimeAsync(500);
    expect(mocks.cartCreate).not.toHaveBeenCalled();
    expect($cart.get()?.totalCents).toBe(2566);
  });

  it('ignora un carrito vacío', async () => {
    $cart.set(null);

    revalidateCartPricing(2566);

    await vi.advanceTimersByTimeAsync(500);
    expect(mocks.cartCreate).not.toHaveBeenCalled();
  });
});
