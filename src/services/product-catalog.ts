import type { ProductCatalogEntry } from "@/lib/types";

export const PRODUCT_CATALOG: Record<string, ProductCatalogEntry> = {
  bottle: { objectClass: "bottle", name: "Bottled Drink", unitPrice: 40 },
  cup: { objectClass: "cup", name: "Cup / Beverage", unitPrice: 30 },
  bowl: { objectClass: "bowl", name: "Snack Bowl", unitPrice: 50 },
  banana: { objectClass: "banana", name: "Banana", unitPrice: 15 },
  apple: { objectClass: "apple", name: "Apple", unitPrice: 30 },
  orange: { objectClass: "orange", name: "Orange", unitPrice: 25 },
  sandwich: { objectClass: "sandwich", name: "Sandwich", unitPrice: 60 },
  cake: { objectClass: "cake", name: "Cake", unitPrice: 50 },
  book: { objectClass: "book", name: "Packaged Item", unitPrice: 50 },
};

export function getProductCatalogEntry(objectClass: string): ProductCatalogEntry | undefined {
  return PRODUCT_CATALOG[objectClass];
}
