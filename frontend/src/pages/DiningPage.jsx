import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Shell from "../components/Shell";

export default function DiningPage() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [latestOrder, setLatestOrder] = useState(null);

  useEffect(() => {
    api.get("/dining/menu").then((response) => setMenu(response.data)).catch(() => {});
  }, []);

  const addToCart = (item) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: {
        ...item,
        quantity: (prev[item.id]?.quantity || 0) + 1,
      },
    }));
  };

  const updateQuantity = (id, quantity) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: { ...prev[id], quantity },
      };
    });
  };

  const cartItems = Object.values(cart);
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const handleOrder = async () => {
    if (!cartItems.length) {
      setError("Add at least one item to continue");
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const payload = {
        items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
      };
      const { data } = await api.post("/dining/orders", payload);
      setLatestOrder(data.order);
      setCart({});
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Shell title="Smart Dining">
      <div className="mobile-note">PWA-ready, mobile-first ordering for faster pickup.</div>
      <div className="two-column">
        <section className="panel">
          <h3>Menu</h3>
          <div className="card-grid compact">
            {menu.map((item) => (
              <article key={item.id} className="menu-card">
                <div>
                  <p className="eyebrow">{item.category}</p>
                  <h4>{item.name}</h4>
                  <p className="muted">{item.description}</p>
                </div>
                <div className="menu-footer">
                  <strong>Rs. {item.price}</strong>
                  <button className="primary-btn inline-btn" onClick={() => addToCart(item)}>
                    Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel sticky-card">
          <h3>Your Cart</h3>
          <div className="stack-list">
            {cartItems.map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.name}</strong>
                  <p className="muted">Rs. {item.price} each</p>
                </div>
                <div className="qty-controls">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))}
            {!cartItems.length ? <p className="muted">Cart is empty.</p> : null}
          </div>
          <div className="summary-row">
            <strong>Total</strong>
            <strong>Rs. {total}</strong>
          </div>
          {error ? <div className="error-banner">{error}</div> : null}
          <button className="primary-btn" onClick={handleOrder} disabled={placing}>
            {placing ? "Simulating payment..." : "Pay & Place Order"}
          </button>

          {latestOrder ? (
            <div className="helper-card">
              <strong>Latest order token: {latestOrder.token}</strong>
              <p>Status: {latestOrder.status}</p>
              <p>Orders ahead: {latestOrder.ordersAhead}</p>
              <p>Estimated wait: {latestOrder.estimatedWaitMinutes} mins</p>
            </div>
          ) : null}
        </section>
      </div>
    </Shell>
  );
}
