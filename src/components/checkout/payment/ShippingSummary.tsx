import Link from "next/link";
import styles from "./ShippingSummary.module.css";

export type ShippingSummaryData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  country: string | null;
  notes: string | null;
};

interface ShippingSummaryProps {
  session: ShippingSummaryData;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className={styles.sectionLabel}>{children}</h3>;
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.dataRow}>
      <span className={styles.dataLabel}>{label}</span>
      <span className={styles.dataValue}>{value}</span>
    </div>
  );
}

export default function ShippingSummary({ session }: ShippingSummaryProps) {
  return (
    <section className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Shipping Summary</h2>
        <Link href="/checkout/shipping" className={styles.editLink}>
          Edit
        </Link>
      </div>

      <div className={styles.contentStack}>

        {/* Personal Details Section */}
        <div>
          <SectionLabel>Personal Details</SectionLabel>
          <DataRow label="Name:" value={`${session.firstName} ${session.lastName}`} />
          <DataRow label="Email:" value={session.email} />
          <DataRow label="Phone:" value={session.phone} />
        </div>

        {/* Address Details Section */}
        <div>
          <SectionLabel>Address Details</SectionLabel>
          <DataRow
            label="Address:"
            value={
              <>
                {session.addressLine1}
                {session.addressLine2 ? `, ${session.addressLine2}` : ""}
              </>
            }
          />
          <DataRow label="City:" value={session.city} />
          {session.country && <DataRow label="Country:" value={session.country} />}
        </div>

        {/* Notes Section */}
        {session.notes && (
          <div className={styles.notesContainer}>
            <SectionLabel>Note</SectionLabel>
            <p className={styles.notesText}>{session.notes}</p>
          </div>
        )}

      </div>
    </section>
  );
}
