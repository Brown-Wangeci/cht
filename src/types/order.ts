export const ORDER_STATUSES = ["paid", "fulfilled", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Paid — to fulfil",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
