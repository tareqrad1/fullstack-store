import { Request, Response } from "express";
import { Types } from "mongoose";
import Category from "../models/category.model";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json({ categories });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const { name, slug, isActive } = req.body as { name?: string; slug?: string; isActive?: boolean };

  if (!name) {
    res.status(400).json({ message: "name is required" });
    return;
  }

  const finalSlug = slug?.trim() || slugify(name);
  if (!finalSlug) {
    res.status(400).json({ message: "slug is required" });
    return;
  }

  const existing = await Category.findOne({ slug: finalSlug });
  if (existing) {
    res.status(409).json({ message: "slug already exists" });
    return;
  }

  const category = await Category.create({ name, slug: finalSlug, isActive: isActive ?? true });
  res.status(201).json({ category });
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid category id" });
    return;
  }
  const { name, slug, isActive } = req.body as { name?: string; slug?: string; isActive?: boolean };

  const updates: { name?: string; slug?: string; isActive?: boolean } = {};
  if (name) updates.name = name;
  if (typeof isActive === "boolean") updates.isActive = isActive;

  if (slug || name) {
    const desired = slug?.trim() || (name ? slugify(name) : undefined);
    if (desired) {
      const existing = await Category.findOne({ slug: desired, _id: { $ne: id } });
      if (existing) {
        res.status(409).json({ message: "slug already exists" });
        return;
      }
      updates.slug = desired;
    }
  }

  const category = await Category.findByIdAndUpdate(id, updates, { new: true });
  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  res.json({ category });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid category id" });
    return;
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  res.json({ message: "Category deleted" });
}
