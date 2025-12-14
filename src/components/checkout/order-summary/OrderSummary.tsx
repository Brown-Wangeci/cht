import { Suspense } from "react";
import OrderSummaryServer from "./OrderSummaryServer";
import OrderSummaryLive from "./OrderSummaryLive";

export default function OrderSummary() {
  return (
    <Suspense fallback={<OrderSummaryServer />}>
      <OrderSummaryLive />
    </Suspense>
  );
}
