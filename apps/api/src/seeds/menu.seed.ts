import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import dataSource from "../data-source";
import { MenuItem } from "../menu/menu-item.entity";
import { MenuCategory } from "@snb/shared";

type Seed = {
  name: string;
  description: string;
  category: MenuCategory;
  calories: number;
  benefits: string[];
  price: number;
};

// All menu items pulled from the official Sip 'N Bite menu boards.
// Prices in PHP. Calorie values are estimates — adjust to your kitchen's actuals.
const items: Seed[] = [
  // === PREMIUM SHAKES — Coffee & Chocolate Blends (22 oz) ===
  {
    name: "Triple Chocolate",
    description: "Herbalife Dutch Chocolate F1, cocoa, chocolate powder, oats, soy milk. Premium 22 oz shake.",
    category: MenuCategory.Shake,
    calories: 290,
    benefits: ["18g Protein", "Premium 22oz", "19 Vitamins & Minerals"],
    price: 200,
  },
  {
    name: "Granola on Triple Chocolate",
    description: "Triple Chocolate shake topped with house granola for a satisfying crunch.",
    category: MenuCategory.Shake,
    calories: 330,
    benefits: ["18g Protein", "Topped with Granola"],
    price: 200,
  },
  {
    name: "Salted Caramel",
    description: "Herbalife French Vanilla F1, coffee caramel, caramel, oats, soy milk. Premium 22 oz shake.",
    category: MenuCategory.Shake,
    calories: 280,
    benefits: ["14g Protein", "Premium 22oz"],
    price: 200,
  },
  {
    name: "Salted Caramel Frappuccino",
    description: "Iced salted caramel frappuccino blended with Herbalife protein. Premium 22 oz.",
    category: MenuCategory.Shake,
    calories: 290,
    benefits: ["14g Protein", "Iced Frappuccino"],
    price: 200,
  },
  {
    name: "Choco Coffee Crumble",
    description: "Herbalife Dutch Chocolate F1, coffee, oats, soy milk. Premium 22 oz shake.",
    category: MenuCategory.Shake,
    calories: 285,
    benefits: ["14g Protein", "Coffee Boost"],
    price: 200,
  },
  {
    name: "Coffee Crumble",
    description: "Premium iced coffee crumble shake with Herbalife protein and rich coffee notes.",
    category: MenuCategory.Shake,
    calories: 285,
    benefits: ["Coffee Crumble", "Premium 22oz"],
    price: 200,
  },

  // === PREMIUM SHAKES — Fruity Blends ===
  {
    name: "Strawberry Cheesecake",
    description: "Herbalife Wild Berry F1, strawberry powder, cream cheese, strawberry jam, soy milk.",
    category: MenuCategory.Shake,
    calories: 290,
    benefits: ["16g Protein", "Real Strawberry", "Cream Cheese"],
    price: 200,
  },
  {
    name: "Blueberry Cheesecake",
    description: "Herbalife Wild Berry F1, blueberry powder, cream cheese, blueberry jam, soy milk.",
    category: MenuCategory.Shake,
    calories: 290,
    benefits: ["16g Protein", "Real Blueberry", "Cream Cheese"],
    price: 200,
  },
  {
    name: "Dulce Mango Delight",
    description: "Herbalife Dulce de Leche F1, mango powder, fresh mango, soy milk. Seasonal.",
    category: MenuCategory.Shake,
    calories: 270,
    benefits: ["14g Protein", "Seasonal", "Fresh Mango"],
    price: 200,
  },
  {
    name: "Dulce Avocado Delight",
    description: "Herbalife Dulce de Leche F1, fresh avocado, avocado powder, cream cheese, soy milk. Seasonal.",
    category: MenuCategory.Shake,
    calories: 310,
    benefits: ["18g Protein", "Seasonal", "Fresh Avocado"],
    price: 200,
  },
  {
    name: "Tutti Fruity (Dragon Fruit)",
    description: "Herbalife Dulce de Leche F1, fresh dragon fruit, cream cheese, soy milk. Seasonal.",
    category: MenuCategory.Shake,
    calories: 275,
    benefits: ["14g Protein", "Seasonal", "Dragon Fruit"],
    price: 200,
  },
  {
    name: "Milky Melon Chiller",
    description: "Herbalife Dulce de Leche F1, fresh melon, cream cheese, soy milk. Seasonal.",
    category: MenuCategory.Shake,
    calories: 270,
    benefits: ["14g Protein", "Seasonal", "Fresh Melon"],
    price: 200,
  },

  // === PREMIUM SHAKES — Milky Blends ===
  {
    name: "Matcha Vanilla Frappe",
    description: "Herbalife French Vanilla F1, matcha powder, cream cheese, soy milk.",
    category: MenuCategory.Shake,
    calories: 285,
    benefits: ["16g Protein", "Matcha"],
    price: 200,
  },
  {
    name: "Ube Macapuno",
    description: "Herbalife French Vanilla F1, ube powder, cream cheese, macapuno, soy milk.",
    category: MenuCategory.Shake,
    calories: 290,
    benefits: ["14g Protein", "Filipino Classic"],
    price: 200,
  },
  {
    name: "Cookies & Cream",
    description: "Herbalife Cookies and Cream F1, cookies and cream powder, crushed cookies, soy milk.",
    category: MenuCategory.Shake,
    calories: 295,
    benefits: ["16g Protein", "Crushed Cookies"],
    price: 200,
  },

  // === CLASSIC SHAKES (₱150) ===
  {
    name: "Classic Dutch Chocolate",
    description: "Classic Herbalife Dutch Chocolate F1 shake. Combine with another flavor at no extra cost.",
    category: MenuCategory.Shake,
    calories: 220,
    benefits: ["Classic", "19 Vitamins & Minerals", "Low Glycemic"],
    price: 150,
  },
  {
    name: "Classic Wild Berry",
    description: "Classic Herbalife Wild Berry F1 shake. Combine with another flavor at no extra cost.",
    category: MenuCategory.Shake,
    calories: 220,
    benefits: ["Classic", "19 Vitamins & Minerals", "Low Glycemic"],
    price: 150,
  },
  {
    name: "Classic French Vanilla",
    description: "Classic Herbalife French Vanilla F1 shake. Combine with another flavor at no extra cost.",
    category: MenuCategory.Shake,
    calories: 220,
    benefits: ["Classic", "19 Vitamins & Minerals", "Low Glycemic"],
    price: 150,
  },
  {
    name: "Classic Dulce de Leche",
    description: "Classic Herbalife Dulce de Leche F1 shake. Combine with another flavor at no extra cost.",
    category: MenuCategory.Shake,
    calories: 220,
    benefits: ["Classic", "19 Vitamins & Minerals", "Low Glycemic"],
    price: 150,
  },
  {
    name: "Classic Cookies and Cream",
    description: "Classic Herbalife Cookies and Cream F1 shake. Combine with another flavor at no extra cost.",
    category: MenuCategory.Shake,
    calories: 220,
    benefits: ["Classic", "19 Vitamins & Minerals", "Low Glycemic"],
    price: 150,
  },

  // === MEAL UPGRADES (shake + aloe + tea bundles) ===
  {
    name: "Classic Meal (with Aloe and Tea)",
    description: "A Classic Shake of your choice paired with Herbal Aloe Concentrate and Herbal Tea Concentrate.",
    category: MenuCategory.Shake,
    calories: 260,
    benefits: ["Complete Meal", "Aloe", "Tea Boost"],
    price: 220,
  },
  {
    name: "Premium Meal (with Aloe and Tea)",
    description: "A Premium Shake of your choice paired with Herbal Aloe Concentrate and Herbal Tea Concentrate.",
    category: MenuCategory.Shake,
    calories: 320,
    benefits: ["Complete Meal", "Aloe", "Tea Boost"],
    price: 280,
  },

  // === HIGH PROTEIN MEALS / SNACKS ===
  {
    name: "High Protein Overnight Oats",
    description: "Overnight oats layered with Herbalife protein, banana, and crunchy granola.",
    category: MenuCategory.Snack,
    calories: 380,
    benefits: ["High Protein", "Whole Grain Oats", "Filling"],
    price: 200,
  },
  {
    name: "High Protein Iced Coffee",
    description: "Iced coffee blended with Herbalife High Protein Iced Coffee Drink Mix. 80 kcal, 15g protein, no added sugar.",
    category: MenuCategory.Shake,
    calories: 80,
    benefits: ["15g Protein", "No Added Sugar", "Low Calorie"],
    price: 200,
  },
  {
    name: "Milky Melon",
    description: "High-protein milky melon meal — refreshing and packed with nutrition.",
    category: MenuCategory.Shake,
    calories: 310,
    benefits: ["High Protein", "Fresh Melon"],
    price: 200,
  },
  {
    name: "High Protein Waffles",
    description: "Fluffy waffles drizzled with peanut butter and protein topping. Pair with any shake.",
    category: MenuCategory.Snack,
    calories: 360,
    benefits: ["High Protein", "Peanut Butter"],
    price: 180,
  },
];

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(MenuItem);

  let created = 0;
  let updated = 0;
  for (const m of items) {
    const existing = await repo.findOne({ where: { name: m.name } });
    if (existing) {
      existing.description = m.description;
      existing.category = m.category;
      existing.calories = m.calories;
      existing.benefits = m.benefits;
      existing.price = m.price.toFixed(2);
      // preserve admin-edited isAvailable + imageUrl
      await repo.save(existing);
      updated++;
    } else {
      await repo.save(
        repo.create({
          name: m.name,
          description: m.description,
          category: m.category,
          calories: m.calories,
          benefits: m.benefits,
          price: m.price.toFixed(2),
          isAvailable: true,
          imageUrl: null,
        }),
      );
      created++;
    }
  }

  console.log(`Menu seed complete — created: ${created}, updated: ${updated}, total in list: ${items.length}`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
