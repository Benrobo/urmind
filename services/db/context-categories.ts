import { ContextCategory } from "@/types/context";
import { UrmindDB } from "@/types/database";
import logger from "@/lib/logger";
import { IDBPDatabase } from "idb";

export class ContextCategoriesService {
  private db: IDBPDatabase<UrmindDB>;

  constructor(db: IDBPDatabase<UrmindDB>) {
    this.db = db;
  }

  /**
   * Create a new category
   */
  async createCategory(
    category: Omit<ContextCategory, "createdAt" | "updatedAt">
  ): Promise<string> {
    const now = Date.now();
    const categoryData: ContextCategory = {
      ...category,
      createdAt: now,
      updatedAt: now,
    };

    const transaction = this.db.transaction(
      ["context_categories"],
      "readwrite"
    );
    const store = transaction.objectStore("context_categories");

    await store.add(categoryData);
    logger.info("✅ Category created:", categoryData.slug);
    return categoryData.slug;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ContextCategory | null> {
    const result = await this.db.get("context_categories", slug);
    return result || null;
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<ContextCategory[]> {
    return await this.db.getAll("context_categories");
  }

  /**
   * Update category
   */
  async updateCategory(
    slug: string,
    updates: Partial<Omit<ContextCategory, "createdAt">>
  ): Promise<void> {
    const existing = await this.getCategoryBySlug(slug);
    if (!existing) {
      throw new Error(`Category with slug "${slug}" not found`);
    }

    const updatedCategory: ContextCategory = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    const transaction = this.db.transaction(
      ["context_categories", "contexts"],
      "readwrite"
    );
    const categoryStore = transaction.objectStore("context_categories");
    const contextStore = transaction.objectStore("contexts");

    // If slug is being changed, update all related contexts and delete the old one
    if (updates.slug && updates.slug !== slug) {
      // Get all contexts with the old category slug
      const contexts = await this.db.getAll("contexts");
      const relatedContexts = contexts.filter(
        (context) => context.categorySlug === slug
      );

      // Update all related contexts with the new category slug
      for (const context of relatedContexts) {
        const updatedContext = {
          ...context,
          categorySlug: updates.slug!,
          updatedAt: Date.now(),
        };
        await contextStore.put(updatedContext);
      }

      // Delete the old category and add the new one
      await categoryStore.delete(slug);
      await categoryStore.add(updatedCategory);

      logger.info(
        `✅ Category updated with new slug: ${updates.slug}, updated ${relatedContexts.length} contexts`
      );
    } else {
      await categoryStore.put(updatedCategory);
      logger.info("✅ Category updated:", slug);
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(slug: string): Promise<void> {
    const transaction = this.db.transaction(
      ["context_categories"],
      "readwrite"
    );
    const store = transaction.objectStore("context_categories");

    await store.delete(slug);
    logger.info("✅ Category deleted:", slug);
  }

  /**
   * Get or create category (useful for ensuring category exists)
   */
  async getOrCreateCategory(
    label: string,
    slug?: string
  ): Promise<ContextCategory> {
    const finalSlug = slug || this.generateSlug(label);

    // Try to get existing category
    const existing = await this.getCategoryBySlug(finalSlug);
    if (existing) {
      return existing;
    }

    // Create new category
    await this.createCategory({
      slug: finalSlug,
      label,
    });

    return (await this.getCategoryBySlug(finalSlug)) as ContextCategory;
  }

  /**
   * Generate slug from label
   */
  private generateSlug(label: string): string {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Get unique category labels (for getAllContextCategories operation)
   */
  async getUniqueCategoryLabels(): Promise<string[]> {
    const categories = await this.getAllCategories();
    return categories.map((cat) => cat.label);
  }
}
