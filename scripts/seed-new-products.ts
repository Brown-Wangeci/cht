import { db } from "@/db";
import { products, productVariants } from "@/db/schema";


async function seed() {
  console.log("Seeding products...");

  const data = [
    {
      product: {
        id: "black-whole-leaf",
        name: "Kiriti Black Whole Leaf",
        slug: "kiriti-black-whole-leaf",
        category: "Black Teas",
        description: "Meticulously crafted from tender, handpicked leaves, selected for their superior quality. It gives a mellow & smooth flavor. Best taken black.",
        images: ["/images/products/black-whole-leaf-1.png", "/images/products/black-whole-leaf-2.png"],
        tastingNotes: ["Mellow", "Smooth"],
        ingredients: "100% Kenyan Orthodox Black Tea",
      },
      variant: { id: "v-bwl-100", weightGrams: 100, price: "500.00", sku: "KIR-BLK-100" }
    },
    {
      product: {
        id: "imperial-black",
        name: "Kiriti Imperial Black Tea",
        slug: "kiriti-imperial-black",
        category: "Black Teas",
        description: "The epitome of elegance and 100% natural. A premium loose leaf tea designed for a refined tea experience.",
        images: ["/images/products/imperial-black-1.png", "/images/products/imperial-black-2.png"],
        tastingNotes: ["Elegant", "Rich"],
        ingredients: "100% Natural Imperial Black Tea",
      },
      variant: { id: "v-imp-250", weightGrams: 250, price: "1200.00", sku: "KIR-IMP-250" }
    },
    {
      product: {
        id: "english-breakfast",
        name: "Kiriti Classic English Breakfast",
        slug: "kiriti-english-breakfast",
        category: "Black Teas",
        description: "A robust and classic blend best taken with milk.",
        images: ["/images/products/english-breakfast-1.png", "/images/products/english-breakfast-2.png"],
        tastingNotes: ["Robust", "Classic"],
        ingredients: "Kenyan Black Tea",
      },
      variant: { id: "v-eb-500", weightGrams: 500, price: "800.00", sku: "KIR-EB-500" }
    },
    {
      product: {
        id: "black-ginger",
        name: "Kiriti Black Ginger Tea",
        slug: "kiriti-black-ginger",
        category: "Flavored Black Teas",
        description: "Premium loose leaf black tea infused with natural ginger. Can be taken with milk.",
        images: ["/images/products/black-ginger-1.png", "/images/products/black-ginger-2.png"],
        tastingNotes: ["Spicy", "Warming"],
        ingredients: "Kenyan Black Tea, Natural Ginger",
      },
      variant: { id: "v-bg-100", weightGrams: 100, price: "450.00", sku: "KIR-BGIN-100" }
    },
    {
      product: {
        id: "masala-chai",
        name: "Kiriti Black Masala Chai",
        slug: "kiriti-masala-chai",
        category: "Flavored Black Teas",
        description: "A traditional spiced tea blend featuring premium black tea and aromatic spices. Can be taken with milk.",
        images: ["/images/products/masala-chai-1.png", "/images/products/masala-chai-2.png"],
        tastingNotes: ["Aromatic", "Spiced"],
        ingredients: "Kenyan Black Tea, Masala Spices",
      },
      variant: { id: "v-mc-100", weightGrams: 100, price: "450.00", sku: "KIR-MAS-100" }
    },
    {
      product: {
        id: "hong-cha",
        name: "Kiriti Hóng Chá",
        slug: "kiriti-hong-cha",
        category: "Black Teas",
        description: "Kenya Chinese Tea (Hóng Chá). A specialty loose leaf tea best taken black.",
        images: ["/images/products/hong-cha-1.png", "/images/products/hong-cha-2.png"],
        tastingNotes: ["Unique", "Cultural Fusion"],
        ingredients: "Kenyan Black Tea (Chinese Style Processing)",
      },
      variant: { id: "v-hc-250", weightGrams: 250, price: "1500.00", sku: "KIR-HONG-250" }
    },
    {
      product: {
        id: "green-tea",
        name: "Kiriti Green Tea",
        slug: "kiriti-green-tea",
        category: "Green Tea",
        description: "Retains its natural green color and fresh, grassy taste. Known for its antioxidant properties and rejuvenating experience.",
        images: ["/images/products/green-tea-1.png", "/images/products/green-tea-2.png"],
        tastingNotes: ["Fresh", "Grassy"],
        ingredients: "100% Kenyan Green Tea",
      },
      variant: { id: "v-gt-100", weightGrams: 100, price: "600.00", sku: "KIR-GRN-100" }
    },
    {
      product: {
        id: "purple-tea",
        name: "Kiriti Purple Tea",
        slug: "kiriti-purple-tea",
        category: "Purple Tea",
        description: "A rare variety with a distinct purple hue from high anthocyanin content. Offers a refreshing taste with subtle floral notes.",
        images: ["/images/products/purple-tea-1.png", "/images/products/purple-tea-2.png"],
        tastingNotes: ["Floral", "Refreshing"],
        ingredients: "100% Kenyan Purple Tea",
      },
      variant: { id: "v-pt-100", weightGrams: 100, price: "750.00", sku: "KIR-PUR-100" }
    },
    {
      product: {
        id: "purple-hibiscus",
        name: "Kiriti Purple Hibiscus",
        slug: "kiriti-purple-hibiscus",
        category: "Herbal Infusions",
        description: "A unique blend that marries the lush richness of purple tea with the tangy brilliance of hibiscus blooms.",
        images: ["/images/products/purple-hibiscus-1.png", "/images/products/purple-hibiscus-2.png"],
        tastingNotes: ["Tangy", "Rich"],
        ingredients: "Purple Tea, Hibiscus Blooms",
      },
      variant: { id: "v-ph-100", weightGrams: 100, price: "700.00", sku: "KIR-PHIB-100" }
    },
    {
      product: {
        id: "hibiscus",
        name: "Kiriti Hibiscus",
        slug: "kiriti-hibiscus",
        category: "Herbal Infusions",
        description: "A rejuvenating caffeine-free herbal infusion crafted from the finest hibiscus blooms.",
        images: [
          "/images/products/hibiscus-1.png",
          "/images/products/hibiscus-2.png",
          "/images/products/hibiscus-3.png"
        ],
        tastingNotes: ["Tart", "Refreshing"],
        ingredients: "100% Hibiscus Blooms",
      },
      variant: { id: "v-hib-100", weightGrams: 100, price: "550.00", sku: "KIR-HIB-100" }
    },
    {
      product: {
        id: "chamomile",
        name: "Kiriti Chamomile",
        slug: "kiriti-chamomile",
        category: "Herbal Infusions",
        description: "A caffeine-free herbal infusion offering soothing calmness with every sip.",
        images: [
          "/images/products/chamomile-1.png",
          "/images/products/chamomile-2.png",
          "/images/products/chamomile-3.png"
        ],
        tastingNotes: ["Calming", "Soothing"],
        ingredients: "100% Chamomile Flowers",
      },
      variant: { id: "v-cham-100", weightGrams: 100, price: "650.00", sku: "KIR-CHAM-100" }
    },
    {
      product: {
        id: "earl-grey",
        name: "Kiriti Earl Grey Tea",
        slug: "kiriti-earl-grey",
        category: "Flavored Black Teas",
        description: "Blends the bold, malty richness of Kenyan black tea with the citrusy brightness of natural bergamot oil.",
        images: [
          "/images/products/earl-grey-1.png",
          "/images/products/earl-grey-2.png"
        ],
        tastingNotes: ["Malty", "Citrusy", "Bright"],
        ingredients: "Kenyan Black Tea, Natural Bergamot Oil",
      },
      variant: { id: "v-eg-100", weightGrams: 100, price: "600.00", sku: "KIR-EG-100" }
    },
    {
      product: {
        id: "rosemary",
        name: "Kiriti Rosemary",
        slug: "kiriti-rosemary",
        category: "Herbal Infusions",
        description: "A caffeine-free herbal infusion made from the freshest rosemary leaves grown naturally in the lush highlands of Kenya.",
        images: ["/images/products/rosemary-1.png", "/images/products/rosemary-2.png"],
        tastingNotes: ["Herbal", "Fresh"],
        ingredients: "100% Natural Rosemary Leaves",
      },
      variant: { id: "v-ros-100", weightGrams: 100, price: "500.00", sku: "KIR-ROS-100" }
    }
  ];

  for (const item of data) {
    await db.insert(products).values(item.product).onConflictDoNothing();
    await db.insert(productVariants).values({
      ...item.variant,
      productId: item.product.id,
      stockOnHand: 50, // Default seed stock
    }).onConflictDoNothing();
  }

  console.log("Seeding completed successfully.");
}

seed().catch(console.error);