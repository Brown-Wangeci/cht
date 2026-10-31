import { desc } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { requireAdmin } from "@/lib/server/admin-auth";
import styles from "../Admin.module.css";

export const metadata = { title: "Subscribers" };

const dateFmt = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" });

export default async function AdminSubscribersPage() {
  await requireAdmin();

  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(5000);

  return (
    <>
      <h1 className={styles.title}>Newsletter subscribers ({rows.length})</h1>

      {rows.length === 0 ? (
        <p className={styles.muted}>No subscribers yet.</p>
      ) : (
        <>
          <p className={styles.muted}>Copy all addresses:</p>
          <textarea
            readOnly
            className={styles.card}
            style={{ width: "100%", minHeight: 80, fontFamily: "inherit", marginBottom: "var(--space-md)" }}
            value={rows.map((r) => r.email).join(", ")}
          />
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.email}</td>
                    <td>{r.createdAt ? dateFmt.format(r.createdAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
