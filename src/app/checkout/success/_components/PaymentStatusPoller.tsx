"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  intervalMs?: number;
  maxAttempts?: number;
  timeoutMessage: React.ReactNode;
};

/** Re-renders the server page until the webhook has created the order (bounded, unlike a meta refresh). */
export default function PaymentStatusPoller({ intervalMs = 3000, maxAttempts = 60, timeoutMessage }: Props) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const timedOut = attempts >= maxAttempts;

  useEffect(() => {
    if (timedOut) return;
    const t = setTimeout(() => {
      router.refresh();
      setAttempts((a) => a + 1);
    }, intervalMs);
    return () => clearTimeout(t);
  }, [attempts, timedOut, intervalMs, router]);

  if (timedOut) return <>{timeoutMessage}</>;

  return <p aria-live="polite">Checking payment status…</p>;
}
