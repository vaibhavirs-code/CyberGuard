import type { ProductCatalogEntry } from "@/lib/types";

export const PRODUCT_CATALOG: Record<string, ProductCatalogEntry> = {
  bottle: { objectClass: "bottle", name: "Amul Milk / Bottled Drink", unitPrice: 40 },
  cup: { objectClass: "cup", name: "Tea / Beverage Cup", unitPrice: 20 },
  bowl: { objectClass: "bowl", name: "Haldiram's Snack Bowl", unitPrice: 50 },
  banana: { objectClass: "banana", name: "Banana", unitPrice: 15 },
  apple: { objectClass: "apple", name: "Apple", unitPrice: 30 },
  orange: { objectClass: "orange", name: "Orange", unitPrice: 25 },
  sandwich: { objectClass: "sandwich", name: "Veg Sandwich", unitPrice: 60 },
  cake: { objectClass: "cake", name: "Bakery Cake Slice", unitPrice: 50 },
  book: { objectClass: "book", name: "Packaged Retail Item", unitPrice: 50 },
  atta: { objectClass: "atta", name: "Aashirvaad Atta", unitPrice: 320 },
  salt: { objectClass: "salt", name: "Tata Salt", unitPrice: 28 },
  biscuits: { objectClass: "biscuits", name: "Parle-G Biscuits", unitPrice: 10 },
  noodles: { objectClass: "noodles", name: "Maggi Noodles", unitPrice: 15 },
  toothpaste: { objectClass: "toothpaste", name: "Colgate Toothpaste", unitPrice: 95 },
  detergent: { objectClass: "detergent", name: "Surf Excel", unitPrice: 120 },
};

export function getProductCatalogEntry(objectClass: string): ProductCatalogEntry | undefined {
  return PRODUCT_CATALOG[objectClass];
}
