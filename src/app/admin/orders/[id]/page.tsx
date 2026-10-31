import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { intasendEvents, orderItems, orders } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin-auth";
import { asUuid } from "@/lib/server/cookies";
import { updateOrderStatus } from "@/lib/actions/admin";
import { formatKES, toMoney } from "@/lib/pricing";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";
import styles from "../../Admin.module.css";

export const metadata = { title: "Order" };

const dateFmt = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

const ACTION_LABELS: Record<OrderStatus, string> = {
  paid: "Mark as unfulfilled",
  fulfilled: "Mark as fulfilled",
  cancelled: "Mark as cancelled",
  refunded: "Mark as refunded",
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: Props) {
  await requireAdmin();

  const id = asUuid((await params).id);
  if (!id) notFound();

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();

  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db
      .select({ createdAt: intasendEvents.createdAt, state: intasendEvents.state, invoiceId: intasendEvents.invoiceId })
      .from(intasendEvents)
      .where(eq(intasendEvents.apiRef, order.checkoutSessionId))
      .orderBy(desc(intasendEvents.createdAt))
      .limit(20),
  ]);

  const status = order.status as OrderStatus;

  return (
    <>
      <p className={styles.muted}>
        <Link href="/admin">← All orders</Link>
      </p>
      <h1 className={styles.title}>
        Order <span className={styles.mono}>#{order.id.slice(0, 8).toUpperCase()}</span>{" "}
        <span className={styles[`badge_${order.status}`] ?? styles.badge}>
          {ORDER_STATUS_LABELS[status] ?? order.status}
        </span>
      </h1>
      <p className={styles.muted}>
        Placed {order.createdAt ? dateFmt.format(order.createdAt) : "—"}
        {order.fulfilledAt ? ` · Fulfilled ${dateFmt.format(order.fulfilledAt)}` : ""}
      </p>

      <div className={styles.actions}>
        {ORDER_STATUSES.filter((s) => s !== status).map((s) => (
          <form key={s} action={updateOrderStatus}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value={s} />
            <button type="submit" className={s === "fulfilled" ? styles.button : styles.buttonSecondary}>
              {ACTION_LABELS[s]}
            </button>
          </form>
        ))}
      </div>

      <h2 className={styles.subtitle}>Items</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th className={styles.num}>Unit price</th>
              <th className={styles.num}>Qty</th>
              <th className={styles.num}>Line total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>
                  {i.name}
                  <div className={styles.muted}>{i.category}</div>
                </td>
                <td>{i.weightGrams}g</td>
                <td className={styles.num}>{formatKES(i.price)}</td>
                <td className={styles.num}>{i.quantity}</td>
                <td className={styles.num}>{formatKES(toMoney(i.price) * i.quantity)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4}>Subtotal</td>
              <td className={styles.num}>{formatKES(order.subtotal ?? order.totalAmount)}</td>
            </tr>
            <tr>
              <td colSpan={4}>Delivery</td>
              <td className={styles.num}>{toMoney(order.shippingFee) > 0 ? formatKES(order.shippingFee) : "Free"}</td>
            </tr>
            <tr>
              <td colSpan={4}>
                <strong>Total paid</strong>
              </td>
              <td className={styles.num}>
                <strong>{formatKES(order.totalAmount)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.grid} style={{ marginTop: "var(--space-lg)" }}>
        <div className={styles.card}>
          <h2>Customer</h2>
          {order.firstName} {order.lastName}
          <br />
          <a href={`mailto:${order.email}`}>{order.email}</a>
          <br />
          <a href={`tel:${order.phone}`}>{order.phone}</a>
        </div>

        <div className={styles.card}>
          <h2>Deliver to</h2>
          {order.addressLine1}
          {order.addressLine2 ? (
            <>
              <br />
              {order.addressLine2}
            </>
          ) : null}
          <br />
          {order.city}
          {order.country ? `, ${order.country}` : ""}
          {order.notes ? (
            <>
              <h2 style={{ marginTop: "var(--space-md)" }}>Notes</h2>
              {order.notes}
            </>
          ) : null}
        </div>

        <div className={styles.card}>
          <h2>Payment</h2>
          Provider: {order.paymentProvider ?? "—"}
          <br />
          IntaSend invoice: <span className={styles.mono}>{order.paymentReference ?? "—"}</span>
          <br />
          Checkout ref: <span className={styles.mono}>{order.checkoutSessionId}</span>
          {events.length > 0 && (
            <>
              <h2 style={{ marginTop: "var(--space-md)" }}>Webhook events</h2>
              {events.map((e, idx) => (
                <div key={idx} className={styles.muted}>
                  {e.createdAt ? dateFmt.format(e.createdAt) : "—"} · {e.state ?? "?"} ·{" "}
                  <span className={styles.mono}>{e.invoiceId}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
