import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const adminUserCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const adminUserUpdateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["USER", "ADMIN"]),
});

export const brandSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  images: z.array(z.string().url()).min(1),
  sizes: z.array(z.string()).min(1),
  colors: z.array(z.string()).min(1),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean().optional(),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
});

export const orderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shipping: z.object({
    name: z.string().min(2),
    address: z.string().min(5),
    city: z.string().min(2),
    postalCode: z.string().min(3),
    phone: z.string().min(5),
    email: z.string().email().optional(),
  }),
  email: z.string().email().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

export const favoriteSchema = z.object({
  productId: z.string().min(1),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});
