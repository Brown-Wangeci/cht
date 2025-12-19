import "dotenv/config";
import { db } from "../src/db";
import { products, productVariants } from "../src/db/schema";

async function seedProducts() {
  console.log("🌱 Seeding premium tea catalog...");

  const data = [
    {
      id: "prod-nandi-hills-gold",
      slug: "nandi-hills-gold",
      name: "Nandi Hills Gold",
      category: "Black Tea",
      description:
        "A bold, malty black tea grown in the cool highlands of Nandi Hills. Deep amber liquor with honeyed malt and gentle citrus notes.",
      images: [
        "/images/products/nandi-hills-gold-1.jpg",
        "/images/products/nandi-hills-gold-2.jpg",
        "/images/products/nandi-hills-gold-3.jpg",
        "/images/products/nandi-hills-gold-4.jpg",
        "/images/products/nandi-hills-gold-5.jpg",
      ],
      tastingNotes: ["Malt", "Citrus Peel", "Honey"],
      ingredients: "100% Kenyan black tea",
      isNew: true,
      isBestSeller: false,
      variants: [
        { id: "var-nandi-100", grams: 100, price: "850", sku: "NHG-100G" },
        { id: "var-nandi-250", grams: 250, price: "1800", sku: "NHG-250G" },
      ],
    },

    {
      id: "prod-mt-kenya-silver-needle",
      slug: "mt-kenya-silver-needle",
      name: "Mt. Kenya Silver Needle",
      category: "White Tea",
      description:
        "Exceptionally rare white tea made from young silver buds, hand-plucked at dawn. Delicate, silky, and lightly floral.",
      images: [
        "/images/products/mt-kenya-silver-needle-1.jpg",
        "/images/products/mt-kenya-silver-needle-2.jpg",
        "/images/products/mt-kenya-silver-needle-3.jpg",
        "/images/products/mt-kenya-silver-needle-4.jpg",
        "/images/products/mt-kenya-silver-needle-5.jpg",
      ],
      tastingNotes: ["Floral", "Apricot", "Fresh Cucumber"],
      ingredients: "Hand-plucked white tea buds",
      isNew: false,
      isBestSeller: false,
      variants: [
        { id: "var-silver-30", grams: 30, price: "1500", sku: "MKS-30G" },
        { id: "var-silver-60", grams: 60, price: "2700", sku: "MKS-60G" },
      ],
    },

    {
      id: "prod-royal-purple-leaf",
      slug: "royal-purple-leaf",
      name: "Royal Purple Leaf",
      category: "Specialty Tea",
      description:
        "Kenya’s famous purple tea, rich in antioxidants. Smooth and lightly sweet with earthy undertones and a plum finish.",
      images: [
        "/images/products/royal-purple-leaf-1.jpg",
        "/images/products/royal-purple-leaf-2.jpg",
        "/images/products/royal-purple-leaf-3.jpg",
        "/images/products/royal-purple-leaf-4.jpg",
        "/images/products/royal-purple-leaf-5.jpg",
      ],
      tastingNotes: ["Plum", "Earth", "Sweet Grass"],
      ingredients: "Kenyan purple tea leaves",
      isNew: false,
      isBestSeller: true,
      variants: [
        { id: "var-purple-50", grams: 50, price: "1200", sku: "RPL-50G" },
        { id: "var-purple-100", grams: 100, price: "2100", sku: "RPL-100G" },
      ],
    },

    {
      id: "prod-kericho-sunrise",
      slug: "kericho-sunrise",
      name: "Kericho Sunrise",
      category: "Breakfast Black Tea",
      description:
        "A bright, brisk black tea crafted for energizing mornings. Strong enough for milk, smooth enough on its own.",
      images: [
        "/images/products/kericho-sunrise-1.jpg",
        "/images/products/kericho-sunrise-2.jpg",
        "/images/products/kericho-sunrise-3.jpg",
        "/images/products/kericho-sunrise-4.jpg",
        "/images/products/kericho-sunrise-5.jpg",
      ],
      tastingNotes: ["Brisk Malt", "Toast", "Light Citrus"],
      ingredients: "Kenyan black tea",
      isNew: false,
      isBestSeller: true,
      variants: [
        { id: "var-kericho-100", grams: 100, price: "700", sku: "KS-100G" },
        { id: "var-kericho-250", grams: 250, price: "1500", sku: "KS-250G" },
      ],
    },

    {
      id: "prod-rift-valley-green",
      slug: "rift-valley-green",
      name: "Rift Valley Green",
      category: "Green Tea",
      description:
        "Clean and refreshing green tea grown along the Rift Valley slopes. Lightly steamed to preserve antioxidants.",
      images: [
        "/images/products/rift-valley-green-1.jpg",
        "/images/products/rift-valley-green-2.jpg",
        "/images/products/rift-valley-green-3.jpg",
        "/images/products/rift-valley-green-4.jpg",
        "/images/products/rift-valley-green-5.jpg",
      ],
      tastingNotes: ["Fresh Grass", "Almond", "Sweet Pea"],
      ingredients: "Kenyan green tea",
      isNew: false,
      isBestSeller: false,
      variants: [
        { id: "var-rift-75", grams: 75, price: "900", sku: "RVG-75G" },
        { id: "var-rift-150", grams: 150, price: "1650", sku: "RVG-150G" },
      ],
    },

    {
      id: "prod-lamu-spiced-chai",
      slug: "lamu-spiced-chai",
      name: "Lamu Spiced Chai",
      category: "Spiced Black Tea",
      description:
        "Inspired by coastal Swahili traditions. A warming blend of black tea and aromatic spices.",
      images: [
        "/images/products/lamu-spiced-chai-1.jpg",
        "/images/products/lamu-spiced-chai-2.jpg",
        "/images/products/lamu-spiced-chai-3.jpg",
        "/images/products/lamu-spiced-chai-4.jpg",
        "/images/products/lamu-spiced-chai-5.jpg",
      ],
      tastingNotes: ["Cardamom", "Cinnamon", "Ginger"],
      ingredients: "Black tea, cardamom, cinnamon, ginger, cloves",
      isNew: false,
      isBestSeller: false,
      variants: [
        { id: "var-lamu-100", grams: 100, price: "950", sku: "LSC-100G" },
        { id: "var-lamu-250", grams: 250, price: "2100", sku: "LSC-250G" },
      ],
    },

    {
      id: "prod-mara-sunset-rooibos",
      slug: "mara-sunset-rooibos",
      name: "Mara Sunset Rooibos",
      category: "Herbal Tea",
      description:
        "Naturally caffeine-free rooibos with smooth honey-like sweetness. Perfect for evenings.",
      images: [
        "/images/products/mara-sunset-rooibos-1.jpg",
        "/images/products/mara-sunset-rooibos-2.jpg",
        "/images/products/mara-sunset-rooibos-3.jpg",
        "/images/products/mara-sunset-rooibos-4.jpg",
        "/images/products/mara-sunset-rooibos-5.jpg",
      ],
      tastingNotes: ["Vanilla", "Honey", "Red Berries"],
      ingredients: "Rooibos leaves",
      isNew: false,
      isBestSeller: false,
      variants: [
        { id: "var-mara-100", grams: 100, price: "800", sku: "MSR-100G" },
        { id: "var-mara-200", grams: 200, price: "1450", sku: "MSR-200G" },
      ],
    },
  ];

  for (const p of data) {
    await db
      .insert(products)
      .values({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        images: p.images,
        tastingNotes: p.tastingNotes,
        ingredients: p.ingredients,
        isNew: p.isNew,
        isBestSeller: p.isBestSeller,
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          description: p.description,
          images: p.images,
          tastingNotes: p.tastingNotes,
          ingredients: p.ingredients,
        },
      });

    for (const v of p.variants) {
      await db
        .insert(productVariants)
        .values({
          id: v.id,
          productId: p.id,
          weightGrams: v.grams,
          price: v.price,
          sku: v.sku,
          stockOnHand: 50,
        })
        .onConflictDoUpdate({
          target: productVariants.id,
          set: {
            price: v.price,
            stockOnHand: 50,
          },
        });
    }
  }

  console.log("✅ Tea catalog seeded successfully");
  process.exit(0);
}

seedProducts().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
