import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import dataSource from "../data-source";
import { Product } from "../products/product.entity";
import { Fulfillment } from "@snb/shared";

type Seed = {
  name: string;
  description: string;
  sku: string;
  price: number;
};

// Prices from Herbalife PH **Preferred Customer Pricelist** (Bronze tier, ~15% off retail,
// VAT inclusive), as of April 7, 2026. Bronze is used as the default walk-in retail price.
// Items not in the official PC pricelist keep estimated values flagged with `// est.`.
const products: Seed[] = [
  // === Formula 1 Nutritional Shake Mix (canister: PC SKU 0128/0127/0129/0435/0569) ===
  { sku: "f1-wildberry-550g",          name: "Formula 1 Nutritional Shake Mix — Wild Berry (550 g)",         price: 1950.03, description: "Healthy meal replacement shake with protein, vitamins, and minerals. Wild Berry, 550 g canister." },
  { sku: "f1-wildberry-sachets",       name: "Formula 1 Nutritional Shake Mix — Wild Berry (Box of 22 Sachets)", price: 2058.78, description: "Convenient on-the-go meal replacement sachets. Wild Berry, box of 22." }, // est. (no Wild Berry sachet SKU in PC list — uses Dutch Choc/French Vanilla sachet price)
  { sku: "f1-dutchchoc-550g",          name: "Formula 1 Nutritional Shake Mix — Dutch Chocolate (550 g)",    price: 1950.03, description: "Healthy meal replacement shake. Dutch Chocolate, 550 g canister." },
  { sku: "f1-dutchchoc-sachets",       name: "Formula 1 Nutritional Shake Mix — Dutch Chocolate (Box of 22 Sachets)", price: 2058.78, description: "On-the-go meal replacement sachets. Dutch Chocolate, box of 22." },
  { sku: "f1-frenchvanilla-550g",      name: "Formula 1 Nutritional Shake Mix — French Vanilla (550 g)",     price: 1950.03, description: "Healthy meal replacement shake. Smooth French Vanilla, 550 g canister." },
  { sku: "f1-frenchvanilla-sachets",   name: "Formula 1 Nutritional Shake Mix — French Vanilla (Box of 22 Sachets)", price: 2058.78, description: "On-the-go meal replacement sachets. French Vanilla, box of 22." },
  { sku: "f1-cookiescream-550g",       name: "Formula 1 Nutritional Shake Mix — Cookies & Cream (550 g)",    price: 1950.03, description: "Healthy meal replacement shake. Cookies & Cream, 550 g canister." },
  { sku: "f1-dulcedeleche-550g",       name: "Formula 1 Nutritional Shake Mix — Dulce de Leche (550 g)",     price: 1950.03, description: "Rich meal replacement shake with a caramel twist. Dulce de Leche, 550 g canister." },

  // === Herbalife24 (Sport) — PC SKU 1417 ===
  { sku: "h24-f1sport-vanilla-524g",   name: "Herbalife24® Formula 1 Sport — Creamy Vanilla (524 g)",        price: 3200, description: "Pre-workout meal replacement for active lifestyles. Creamy Vanilla, 524 g." }, // est. — not in current PC pricelist
  { sku: "h24-rebuild-choc-1000g",     name: "Herbalife24® Rebuild Strength — Chocolate (1000 g)",           price: 3995.66, description: "Post-workout recovery shake with whey and casein protein. Chocolate, 1000 g." },

  // === Protein boosters & coffee (PC SKU 0242, 011K, 012K) ===
  { sku: "personalized-protein-240g",  name: "Personalized Protein Powder — Unflavored (240 g)",             price: 1514.69, description: "Add to shakes or food to support lean muscle. Unflavored, 240 g." },
  { sku: "hpic-mocha-308g",            name: "High Protein Iced Coffee Drink Mix — Mocha (308 g)",           price: 2097.87, description: "Iced coffee drink mix with 15 g protein per serving. Mocha, 308 g." },
  { sku: "hpic-cafelatte-308g",        name: "High Protein Iced Coffee Drink Mix — Café Latte (308 g)",      price: 2097.87, description: "Iced coffee drink mix with 15 g protein per serving. Café Latte, 308 g." },

  // === Herbal Tea Concentrate & Retreat Tea (PC SKU 0105, 0106, 0759, 044K) ===
  { sku: "htc-original-51g",           name: "Herbal Tea Concentrate — Original (51 g)",                     price: 1521.41, description: "Energizing herbal tea concentrate. Original flavor, 51 g travel size." },
  { sku: "htc-original-102g",          name: "Herbal Tea Concentrate — Original (102 g)",                    price: 2569.56, description: "Energizing herbal tea concentrate. Original flavor, 102 g." },
  { sku: "htc-applechamomile-102g",    name: "Herbal Tea Concentrate — Apple Chamomile (102 g)",             price: 2587.87, description: "Refreshing low-calorie tea blend that boosts energy. Apple Chamomile, 102 g." },
  { sku: "herbalretreat-peppermint-48g", name: "Herbal Retreat Tea — Peppermint (48 g)",                     price: 1983.35, description: "Calming peppermint herbal tea for end-of-day relaxation. 48 g." },

  // === Herbal Aloe Concentrate (PC SKU 0006, 1065, 2631) ===
  { sku: "hac-original-473ml",         name: "Herbal Aloe Concentrate Drink Mix — Original (473 ml)",        price: 1949.70, description: "Soothing aloe drink mix for digestive comfort. Original, 473 ml." },
  { sku: "hac-mandarin-473ml",         name: "Herbal Aloe Concentrate Drink Mix — Mandarin (473 ml)",        price: 1949.70, description: "Soothing aloe drink mix that supports digestive comfort. Mandarin, 473 ml." },
  { sku: "hac-mango-473ml",            name: "Herbal Aloe Concentrate Drink Mix — Mango (473 ml)",           price: 1949.70, description: "Soothing aloe drink mix with a tropical mango twist. 473 ml." },

  // === Vitamins, supplements, targeted health ===
  { sku: "f2-vitamins-90t",            name: "Formula 2 Vitamins & Minerals (90 tablets)",                   price: 720.72, description: "Daily multivitamin and mineral complex supporting overall wellness. 90 tablets." }, // PC SKU 3122
  { sku: "fiberandherb-180t",          name: "Fiber and Herb Complex (180 tablets)",                         price: 681.63, description: "Blend of fiber and herbs that supports digestion and elimination. 180 tablets." }, // PC SKU 3114
  { sku: "herbalifeline-90s",          name: "Herbalifeline™ Omega-3 (90 softgels)",                         price: 1898.57, description: "Omega-3 EPA and DHA softgels for heart and brain health. 90 softgels." }, // PC SKU 0065
  { sku: "tripleberry-30c",            name: "Triple Berry Complex (30 capsules)",                           price: 1095.36, description: "Antioxidant berry blend supporting cellular health. 30 capsules." }, // PC SKU 0279
  { sku: "tangkuei-60t",               name: "Tang Kuei Plus (60 tablets)",                                  price: 1049.94, description: "Herbal blend traditionally used to support women's wellness. 60 tablets." }, // PC SKU 0566
  { sku: "nrg-60t",                    name: "NRG – Nature's Raw Guarana (60 tablets)",                      price: 1012.76, description: "Natural guarana tablets for a clean energy boost. 60 tablets." }, // PC SKU 0124
  { sku: "megagarlic-vitc-30t",        name: "Mega Garlic Extract with Vitamin C (30 tablets)",              price: 1014.50, description: "Concentrated garlic extract with vitamin C for immune support. 30 tablets." }, // PC SKU 0032
  { sku: "oculardefense-30t",          name: "Ocular Defense (30 tablets)",                                  price: 1220.13, description: "Eye health support with lutein, zeaxanthin, and antioxidants. 30 tablets." }, // PC SKU 0064
  { sku: "xtracal-advanced-60t",       name: "Xtra-Cal Advanced (60 tablets)",                               price: 796.99, description: "Calcium and vitamin D for bone health. 60 tablets." }, // PC SKU 0020
  { sku: "mineralherbalcomplex-90t",   name: "Mineral Herbal Complex (90 tablets)",                          price: 1058.68, description: "Herbal mineral blend that supports hydration balance. 90 tablets." }, // PC SKU 0111
  { sku: "cellcomplex-60t",            name: "Cell Complex (60 tablets)",                                    price: 1729.67, description: "Cellular nutrition complex with key micronutrients. 60 tablets." }, // PC SKU 3123
  { sku: "simplyprobiotic-30g",        name: "Simply Probiotics (30 g)",                                     price: 1549.97, description: "Daily probiotic powder supporting gut health. 30 g." }, // PC SKU 1829

  // === Skin care line — not in current PC pricelist; estimates preserved ===
  { sku: "skin-cleanser-150ml",        name: "Herbalife SKIN® Soothing Aloe Cleanser (150 ml)",              price: 1450, description: "Aloe-based cleanser that gently removes impurities without drying. 150 ml." }, // est.
  { sku: "skin-toner-150ml",           name: "Herbalife SKIN® Energizing Herbal Toner (150 ml)",             price: 1450, description: "Refreshing herbal toner to balance and energize skin. 150 ml." }, // est.
  { sku: "skin-berryscrub-120ml",      name: "Herbalife SKIN® Instant Reveal Berry Scrub (120 ml)",          price: 1500, description: "Gentle exfoliating scrub with real berry seeds for instant glow. 120 ml." }, // est.
  { sku: "skin-serum-30ml",            name: "Herbalife SKIN® Line Minimizing Serum (30 ml)",                price: 2400, description: "Anti-aging serum that helps reduce the appearance of fine lines. 30 ml." }, // est.
  { sku: "skin-moisturizer-spf30-30ml", name: "Herbalife SKIN® Protective Moisturizer SPF 30/PA (30 ml)",    price: 1900, description: "Lightweight broad-spectrum SPF 30 moisturizer that protects and hydrates daily. 30 ml." }, // est.

  // === Specialty (PC SKU 3150) ===
  { sku: "niteworks-lemon-150g",       name: "Niteworks® — Lemon (150 g)",                                   price: 3420.48, description: "Nighttime drink mix supporting nitric oxide production for circulation. Lemon, 150 g." },

  // === Immune & Digestive (PC SKU 145K, 2864, 0130) ===
  { sku: "immulift",                   name: "Immulift",                                                     price: 667.80, description: "Immune support supplement formulated with key vitamins and botanicals." },
  { sku: "active-fiber-apple",         name: "Active Fiber Complex — Apple Flavor",                          price: 1701.56, description: "Soluble fiber drink mix that supports digestive regularity. Apple flavor." },
  { sku: "fiberbond-90t",              name: "Fiberbond (90 tablets)",                                       price: 1164.97, description: "Fiber tablets to support a healthy digestive system. 90 tablets." },

  // === Outer Nutrition — Herbal Aloe body line (PC SKU 2561–2565) ===
  { sku: "ha-handbodywash-250ml",      name: "Herbal Aloe Hand and Body Wash (250 ml)",                      price: 782.60, description: "Gentle aloe-based cleanser for hands and body. 250 ml." },
  { sku: "ha-soothinggel-200ml",       name: "Herbal Aloe Soothing Gel (200 ml)",                            price: 782.60, description: "Cooling aloe gel that soothes and refreshes skin. 200 ml." },
  { sku: "ha-handbodycream-200ml",     name: "Herbal Aloe Hand and Body Cream (200 ml)",                     price: 782.60, description: "Moisturizing aloe cream for hands and body. 200 ml." },
  { sku: "ha-shampoo-250ml",           name: "Herbal Aloe Strengthening Shampoo (250 ml)",                   price: 782.60, description: "Strengthening aloe shampoo for healthier-looking hair. 250 ml." },
  { sku: "ha-conditioner-250ml",       name: "Herbal Aloe Strengthening Conditioner (250 ml)",               price: 782.60, description: "Strengthening aloe conditioner that nourishes and detangles. 250 ml." },

  // === Starter Kits (PC SKU 3T47–3T50) ===
  { sku: "kit-general-wellness-vanilla-choco",
    name: "General Wellness Kit — Vanilla & Choco",
    price: 8419.32,
    description: "F1 French Vanilla canister + F1 Dutch Chocolate canister + Herbal Aloe Mandarin + Herbal Tea Original 102g.",
  },
  { sku: "kit-general-wellness-choco-berry",
    name: "General Wellness Kit — Choco & Berry",
    price: 8419.32,
    description: "F1 Dutch Chocolate canister + F1 Wild Berry canister + Herbal Aloe Mandarin + Herbal Tea Original 102g.",
  },
  { sku: "kit-ultimate-wellness-vanilla-choco",
    name: "Ultimate Wellness Kit — Vanilla & Choco",
    price: 14328.89,
    description: "F1 French Vanilla + F1 Dutch Chocolate + Herbal Aloe Mandarin + Herbal Tea Original 102g + Simply Probiotic + Mineral Herbal Complex + Fiber & Herbs + Formula 2 Vitamins & Minerals + Herbalifeline.",
  },
  { sku: "kit-ultimate-wellness-choco-berry",
    name: "Ultimate Wellness Kit — Choco & Berry",
    price: 14328.89,
    description: "F1 Dutch Chocolate + F1 Wild Berry + Herbal Aloe Mandarin + Herbal Tea Original 102g + Simply Probiotic + Mineral Herbal Complex + Fiber & Herbs + Formula 2 Vitamins & Minerals + Herbalifeline.",
  },

  // === Promotional Packs (PC SKU 14Z3, 4T30–4T35) ===
  { sku: "trial-pack-f1-7days",
    name: "7 Days Formula 1 Trial Pack",
    price: 778.34,
    description: "F1 Dutch Chocolate sachets + F1 French Vanilla sachets + shaker bottle. A one-week intro.",
  },
  { sku: "summer-energy-choco-mocha",
    name: "Summer Energy Pack — Choco Mocha",
    price: 10744.89,
    description: "F1 Dutch Chocolate + High Protein Iced Coffee Mocha + Herbal Aloe Mandarin + Herbal Tea Original 102g + NRG + Fiberbond + Summer Energy Pack tumbler.",
  },
  { sku: "summer-energy-wildberry-mocha",
    name: "Summer Energy Pack — Wild Berry Mocha",
    price: 10744.89,
    description: "F1 Wild Berry + High Protein Iced Coffee Mocha + Herbal Aloe Mandarin + Herbal Tea Original 102g + NRG + Fiberbond + Summer Energy Pack tumbler.",
  },
  { sku: "summer-energy-vanilla-mocha",
    name: "Summer Energy Pack — Vanilla Mocha",
    price: 10744.89,
    description: "F1 French Vanilla + High Protein Iced Coffee Mocha + Herbal Aloe Mandarin + Herbal Tea Original 102g + NRG + Fiberbond + Summer Energy Pack tumbler.",
  },
  { sku: "summer-energy-choco-latte",
    name: "Summer Energy Pack — Choco Latte",
    price: 10744.89,
    description: "F1 Dutch Chocolate + High Protein Iced Coffee Café Latte + Herbal Aloe Mandarin + Herbal Tea Original 102g + NRG + Fiberbond + Summer Energy Pack tumbler.",
  },
  { sku: "summer-energy-wildberry-latte",
    name: "Summer Energy Pack — Wild Berry Latte",
    price: 10744.89,
    description: "F1 Wild Berry + High Protein Iced Coffee Café Latte + Herbal Aloe Mandarin + Herbal Tea Original 102g + NRG + Fiberbond + Summer Energy Pack tumbler.",
  },
  { sku: "summer-energy-vanilla-latte",
    name: "Summer Energy Pack — Vanilla Latte",
    price: 10744.89,
    description: "F1 French Vanilla + High Protein Iced Coffee Café Latte + Herbal Aloe Mandarin + Herbal Tea Original 102g + NRG + Fiberbond + Summer Energy Pack tumbler.",
  },

  // === Art of Promotion accessories (PC SKU 8B89–305A) ===
  { sku: "shaker-organizer-green",     name: "Shaker Bottle with Daily Tablets Organizer — Green",           price: 165.76, description: "Shaker bottle with a built-in daily pill organizer. Green." },
  { sku: "shaker-organizer-white",     name: "Shaker Bottle with Daily Tablets Organizer — White",           price: 165.76, description: "Shaker bottle with a built-in daily pill organizer. White." },
  { sku: "shaker-organizer-gray",      name: "Shaker Bottle with Daily Tablets Organizer — Gray",            price: 165.76, description: "Shaker bottle with a built-in daily pill organizer. Gray." },
  { sku: "shaker-organizer-set3",      name: "Shaker Bottle with Daily Tablets Organizer — Set of 3",        price: 453.60, description: "Three-pack of shaker bottles with pill organizers." },
  { sku: "shaker-cup-set5",            name: "Shaker Cup — Set of 5",                                        price: 656.32, description: "Classic Herbalife shaker cup. Set of 5." },
  { sku: "shaker-cup-single",          name: "Shaker Cup — Single",                                          price: 137.76, description: "Classic Herbalife shaker cup. Single." },
  { sku: "measuring-spoon-set10",      name: "Measuring Spoon — Set of 10",                                  price: 890.40, description: "Branded measuring spoons. Set of 10." },
  { sku: "measuring-spoon-single",     name: "Measuring Spoon — Single",                                     price: 94.08, description: "Branded measuring spoon. Single." },
  { sku: "waterbottle-2l-green",       name: "Water Bottle 2 L — Green",                                     price: 523.04, description: "Reusable Herbalife water bottle, 2 litre. Green." },
  { sku: "waterbottle-1l-green",       name: "Water Bottle 1 L — Green",                                     price: 460.32, description: "Reusable Herbalife water bottle, 1 litre. Green." },
  { sku: "waterbottle-1l-blue",        name: "Water Bottle 1 L — Blue",                                      price: 460.32, description: "Reusable Herbalife water bottle, 1 litre. Blue." },
  { sku: "waterbottle-1l-orange",      name: "Water Bottle 1 L — Orange",                                    price: 460.32, description: "Reusable Herbalife water bottle, 1 litre. Orange." },
  { sku: "tabletbox-sm-set10",         name: "Tablet Box (Small, Translucent) — Set of 10",                  price: 219.52, description: "Small translucent tablet boxes. Set of 10." },
  { sku: "tabletbox-med-set5",         name: "Tablet Box (Medium, Translucent) — Set of 5",                  price: 309.12, description: "Medium translucent tablet boxes. Set of 5." },

  // === Prints & Literature (PC SKU 602N, 603N, 538N, 3N50) ===
  { sku: "ecobag-single",              name: "Gogreen Ecobag — Single",                                      price: 44.80, description: "Reusable Gogreen ecobag. Single." },
  { sku: "ecobag-set5",                name: "Gogreen Ecobags — Set of 5",                                   price: 200.48, description: "Reusable Gogreen ecobags. Set of 5." },
  { sku: "reusable-shopping-bag",      name: "Gogreen Reusable Shopping Bag",                                price: 96.32, description: "Branded reusable shopping bag." },
  { sku: "paperbag-large-set5",        name: "Herbalife Large Paper Bags — Set of 5",                        price: 571.20, description: "Branded large paper bags. Set of 5." },
];

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Product);

  let created = 0;
  let updated = 0;
  for (const p of products) {
    const existing = await repo.findOne({ where: { sku: p.sku } });
    if (existing) {
      existing.name = p.name;
      existing.description = p.description;
      existing.price = p.price.toFixed(2);
      // preserve admin-edited stock / isPreorder / fulfillment / imageUrl
      await repo.save(existing);
      updated++;
    } else {
      await repo.save(
        repo.create({
          name: p.name,
          description: p.description,
          sku: p.sku,
          price: p.price.toFixed(2),
          stock: 0,
          isPreorder: true,
          fulfillment: Fulfillment.Both,
          imageUrl: null,
        }),
      );
      created++;
    }
  }

  console.log(`Seed complete — created: ${created}, updated: ${updated}, total in list: ${products.length}`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
