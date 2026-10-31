import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin-auth";
import { formatKES } from "@/lib/pricing";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";
import styles from "./Admin.module.css";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 50;

const dateFmt = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();

  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const page = Math.max(1, Math.trunc(Number(sp.page)) || 1);

  const [rows, statusCounts] = await Promise.all([
    db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        firstName: orders.firstName,
        lastName: orders.lastName,
        email: orders.email,
        city: orders.city,
        totalAmount: orders.totalAmount,
        status: orders.status,
        itemCount: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0) from ${orderItems} where ${orderItems.orderId} = ${orders.id})`.mapWith(Number),
      })
      .from(orders)
      .where(status ? eq(orders.status, status) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const visible = rows.slice(0, PAGE_SIZE);
  const countFor = (s: string) => statusCounts.find((c) => c.status === s)?.n ?? 0;
  const total = statusCounts.reduce((t, c) => t + c.n, 0);

  const pageHref = (p: number) => `/admin?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <>
      <h1 className={styles.title}>Orders</h1>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.muted}>To fulfil</div>
          <div className={styles.statValue}>{countFor("paid")}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.muted}>Fulfilled</div>
          <div className={styles.statValue}>{countFor("fulfilled")}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.muted}>All orders</div>
          <div className={styles.statValue}>{total}</div>
        </div>
      </div>

      <div className={styles.tabs}>
        <Link href="/admin" className={!status ? styles.tabActive : styles.tab}>
          All ({total})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={status === s ? styles.tabActive : styles.tab}>
            {ORDER_STATUS_LABELS[s]} ({countFor(s)})
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className={styles.muted}>No orders yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>City</th>
                <th className={styles.num}>Items</th>
                <th className={styles.num}>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className={styles.mono}>
                      #{o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td>{o.createdAt ? dateFmt.format(o.createdAt) : "—"}</td>
                  <td>
                    {o.firstName} {o.lastName}
                    <div className={styles.muted}>{o.email}</div>
                  </td>
                  <td>{o.city}</td>
                  <td className={styles.num}>{o.itemCount}</td>
                  <td className={styles.num}>{formatKES(o.totalAmount)}</td>
                  <td>
                    <span className={styles[`badge_${o.status}`] ?? styles.badge}>
                      {ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className={styles.actions}>
          {page > 1 && (
            <Link href={pageHref(page - 1)} className={styles.tab}>
              ← Newer
            </Link>
          )}
          {hasMore && (
            <Link href={pageHref(page + 1)} className={styles.tab}>
              Older →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
