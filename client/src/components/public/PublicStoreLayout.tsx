import { ShoppingCart, Store } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePublicCart } from "@/features/public-store/lib/public-cart";
import { cn } from "@/lib/utils";

export function PublicStoreLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const { itemCount } = usePublicCart();
  const navItems = [
    { href: "/loja", label: "Loja" },
    { href: "/loja/catalogo", label: "Catálogo" },
    { href: "/loja/carrinho", label: "Carrinho" },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff1f2,transparent_35%),linear-gradient(180deg,#fffaf5_0%,#fff 55%,#fef2f2_100%)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/loja">
            <a className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-500 p-2 text-white shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-rose-950">
                  Doce Gestão
                </p>
                <p className="text-xs text-rose-700">Loja da confeitaria</p>
              </div>
            </a>
          </Link>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive =
                location === item.href || location.startsWith(`${item.href}/`);

              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-rose-500 text-white"
                        : "text-rose-900 hover:bg-rose-100",
                    )}
                  >
                    {item.label}
                  </a>
                </Link>
              );
            })}

            <Link href="/loja/carrinho">
              <a className="relative rounded-full border border-rose-200 bg-white px-4 py-2 text-rose-900 shadow-sm">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </a>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-rose-950">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-rose-800">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
