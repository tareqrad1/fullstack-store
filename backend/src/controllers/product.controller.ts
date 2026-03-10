import { Request, Response } from "express";
import { Types } from "mongoose";
import Product from "../models/product.model";
import Category from "../models/category.model";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toNumber(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const brandParam = typeof req.query.brand === "string" ? req.query.brand : undefined;
  const minPrice = toNumber(req.query.minPrice);
  const maxPrice = toNumber(req.query.maxPrice);
  const minRating = toNumber(req.query.minRating);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (brandParam) {
    const brands = brandParam.split(",").map((b) => b.trim()).filter(Boolean);
    if (brands.length > 0) {
      filter.brand = { $in: brands };
    }
  }

  if (typeof minPrice === "number" || typeof maxPrice === "number") {
    filter.price = {};
    if (typeof minPrice === "number") (filter.price as Record<string, number>).$gte = minPrice;
    if (typeof maxPrice === "number") (filter.price as Record<string, number>).$lte = maxPrice;
  }

  if (typeof minRating === "number") {
    filter.averageRating = { $gte: minRating };
  }

  const sortKey = typeof req.query.sort === "string" ? req.query.sort : "newest";
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating_desc: { averageRating: -1 },
  };

  const sort = sortMap[sortKey] || sortMap.newest;

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .populate("category", "_id name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));

  res.json({
    products,
    page,
    pages,
    total,
    limit,
  });
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid product id" });
    return;
  }
  const product = await Product.findById(id).populate("category", "_id name slug");
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json({ product });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const { name, slug, brand, description, price, images, category, countInStock, isActive, averageRating } = req.body as {
    name: string;
    slug: string;
    brand: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    countInStock: number;
    isActive: boolean;
    averageRating: number;
  };

  if (!name || typeof price !== "number" || typeof countInStock !== "number" || !category) {
    res.status(400).json({ message: "name, price, countInStock, category are required" });
    return;
  }

  if (price < 0 || countInStock < 0) {
    res.status(400).json({ message: "price and countInStock must be >= 0" });
    return;
  }

  if (typeof averageRating === "number" && (averageRating < 0 || averageRating > 5)) {
    res.status(400).json({ message: "averageRating must be between 0 and 5" });
    return;
  }

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400).json({ message: "Invalid category" });
    return;
  }

  const finalSlug = slug?.trim() || slugify(name);
  if (!finalSlug) {
    res.status(400).json({ message: "slug is required" });
    return;
  }

  const existing = await Product.findOne({ slug: finalSlug });
  if (existing) {
    res.status(409).json({ message: "slug already exists please add another one !" });
    return;
  }

  const product = await Product.create({
    name,
    slug: finalSlug,
    brand,
    description,
    price,
    images: images ?? [],
    category,
    countInStock,
    averageRating: averageRating ?? 0,
    isActive: isActive ?? true,
  });

  res.status(201).json({ product });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid product id" });
    return;
  }
  const { name, slug, brand, description, price, images, category, countInStock, isActive, averageRating } = req.body as {
    name?: string;
    slug?: string;
    brand?: string;
    description?: string;
    price?: number;
    images?: string[];
    category?: string;
    countInStock?: number;
    isActive?: boolean;
    averageRating?: number;
  };

  if (typeof price === "number" && price < 0) {
    res.status(400).json({ message: "price must be >= 0" });
    return;
  }

  if (typeof countInStock === "number" && countInStock < 0) {
    res.status(400).json({ message: "countInStock must be >= 0" });
    return;
  }

  if (typeof averageRating === "number" && (averageRating < 0 || averageRating > 5)) {
    res.status(400).json({ message: "averageRating must be between 0 and 5" });
    return;
  }

  const updates: {
    name?: string;
    slug?: string;
    brand?: string;
    description?: string;
    price?: number;
    images?: string[];
    category?: string;
    countInStock?: number;
    isActive?: boolean;
    averageRating?: number;
  } = {};

  if (name) updates.name = name;
  if (brand) updates.brand = brand;
  if (description) updates.description = description;
  if (typeof price === "number") updates.price = price;
  if (Array.isArray(images)) updates.images = images;
  if (typeof countInStock === "number") updates.countInStock = countInStock;
  if (typeof isActive === "boolean") updates.isActive = isActive;
  if (typeof averageRating === "number") updates.averageRating = averageRating;

  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      res.status(400).json({ message: "Invalid category" });
      return;
    }
    updates.category = category;
  }

  if (slug || name) {
    const desired = slug?.trim() || (name ? slugify(name) : undefined);
    if (desired) {
      const existing = await Product.findOne({ slug: desired, _id: { $ne: id } });
      if (existing) {
        res.status(409).json({ message: "slug already exists" });
        return;
      }
      updates.slug = desired;
    }
  }

  const product = await Product.findByIdAndUpdate(id, updates, { new: true });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.json({ product });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid product id" });
    return;
  }
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  res.json({ message: "Product deleted successfully" });
}
