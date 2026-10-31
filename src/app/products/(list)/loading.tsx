import Loader from "@/components/ui/loader/Loader";

export default function Loading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4xl) 0" }}>
      <Loader label="Loading products" />
    </div>
  );
}
