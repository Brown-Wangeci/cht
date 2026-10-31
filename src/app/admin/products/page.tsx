import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin-auth";
import { setProductActive, updateVariantStock } from "@/lib/actions/admin";
import { formatKES } from "@/lib/pricing";
import styles from "../Admin.module.css";

export const metadata = { title: "Products & stock" };

export default async function AdminProductsPage() {
  await requireAdmin();

  const rows = await db.query.products.findMany({
    with: { variants: true },
    orderBy: [asc(products.name)],
  });

  return (
    <>
      <h1 className={styles.title}>Products &amp; stock</h1>
      <p className={styles.muted}>
        Stock is reduced automatically when an order is paid. Hidden products disappear from the shop but keep their
        order history.
      </p>

      <div className={styles.tableWrap} style={{ marginTop: "var(--space-md)" }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Variant</th>
              <th className={styles.num}>Price</th>
              <th>Stock on hand</th>
              <th>Visibility</th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((p) =>
              (p.variants.length ? p.variants : [null]).map((v, idx) => (
                <tr key={v?.id ?? p.id}>
                  {idx === 0 && (
                    <td rowSpan={Math.max(1, p.variants.length)}>
                      <Link href={`/products/${p.slug}`} target="_blank">
                        {p.name}
                      </Link>
                      <div className={styles.muted}>{p.category}</div>
                    </td>
                  )}
                  <td>
                    {v ? (
                      <>
                        {v.weightGrams}g<div className={`${styles.muted} ${styles.mono}`}>{v.sku ?? v.id}</div>
                      </>
                    ) : (
                      <span className={styles.muted}>No variants</span>
                    )}
                  </td>
                  <td className={styles.num}>{v ? formatKES(v.price) : "—"}</td>
                  <td>
                    {v && (
                      <form action={updateVariantStock} className={styles.inlineForm}>
                        <input type="hidden" name="variantId" value={v.id} />
                        <input
                          type="number"
                          name="stock"
                          min={0}
                          max={100000}
                          defaultValue={v.stockOnHand ?? 0}
                          className={styles.input}
                          aria-label={`Stock for ${p.name} ${v.weightGrams}g`}
                        />
                        <button type="submit" className={styles.buttonSecondary}>
                          Save
                        </button>
                      </form>
                    )}
                  </td>
                  {idx === 0 && (
                    <td rowSpan={Math.max(1, p.variants.length)}>
                      <form action={setProductActive}>
                        <input type="hidden" name="productId" value={p.id} />
                        <input type="hidden" name="active" value={p.active === false ? "true" : "false"} />
                        <button type="submit" className={p.active === false ? styles.button : styles.buttonSecondary}>
                          {p.active === false ? "Show in shop" : "Hide from shop"}
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
