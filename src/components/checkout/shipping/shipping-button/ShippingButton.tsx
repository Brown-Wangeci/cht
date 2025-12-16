"use client";

import { useCartStore } from "@/lib/stores/cart";
import { useFormStatus } from "react-dom"; // Hook to check form submission status

// Define props for any server-passed data (like the action)
interface ShippingButtonProps {
    className: string;
    helperClassName: string;
}

export default function ShippingButton({ className, helperClassName }: ShippingButtonProps) {
    const { pending } = useFormStatus();

    // 1. Select the validation state from the store
    const count = useCartStore((s) => s.count);
    const dirty = useCartStore((s) => s.dirty);
    const syncing = useCartStore((s) => s.syncing);

    // 2. Determine the button's disabled state
    const isCartEmpty = count === 0;
    const isSyncingBlocked = dirty || syncing;
    const isBlocked = isCartEmpty || isSyncingBlocked || pending;

    // 3. Set the helper text based on the blocking reason
    let helperText = "You can still go back and add items — only the order summary updates.";
    let buttonText = "Continue to payment";
    
    if (pending) {
        buttonText = "Submitting...";
    } else if (isCartEmpty) {
        helperText = "Please add at least one item to your cart to proceed to payment.";
    } else if (isSyncingBlocked) {
        helperText = "The cart is currently syncing with the server. Please wait...";
    }

    return (
        <>
            <button 
                className={className} 
                type="submit"
                disabled={isBlocked}
            >
                {buttonText}
            </button>
            <p className={helperClassName}>
                {helperText}
            </p>
        </>
    );
}