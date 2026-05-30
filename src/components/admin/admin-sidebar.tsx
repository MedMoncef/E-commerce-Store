"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Layers,
  Ruler,
  Palette,
  Image as ImageIcon,
  ShoppingCart,
  Mail,
  Users,
  Home,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/sizes", label: "Sizes", icon: Ruler },
  { href: "/admin/colors", label: "Colors", icon: Palette },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: Mail },
];

type AdminSidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card p-6">
      <div className="space-y-1">
        <p className="heading-font text-lg font-semibold">Northwind Admin</p>
        <p className="text-xs text-muted-foreground">
          {user.name || user.email}
        </p>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2">
        <Button
          asChild
          variant="outline"
          className="w-full justify-start border-primary/30 text-primary hover:bg-primary/10"
        >
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Storefront
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
