import {
  CakeSlice,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePublicCart } from "@/features/public-store/lib/public-cart";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { authQueryKeys } from "@/features/auth/lib/auth-query-keys";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function PublicStoreLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [location, setLocation] = useLocation();
  const { itemCount } = usePublicCart();
  const { toast } = useToast();
  const authSessionQuery = useAuthSession();
  const logoutMutation = useLogout();
  const user = authSessionQuery.data?.data ?? null;
  const navItems = [
    { href: "/loja", label: "Loja" },
    { href: "/loja/catalogo", label: "Catalogo" },
    { href: "/loja/carrinho", label: "Carrinho" },
    ...(user ? [{ href: "/conta", label: "Minha conta" }] : []),
  ];

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.session(),
      });
      setLocation("/login");
    } catch {
      toast({
        title: "Nao foi possivel sair",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/loja">
            <a className="transition-transform duration-300 hover:scale-[1.01]">
              <BrandLogo
                className="gap-4"
                imageClassName="h-16 w-16"
              />
            </a>
          </Link>

          <nav className="flex flex-wrap items-center justify-end gap-2">
            {navItems.map((item) => {
              const isActive =
                location === item.href || location.startsWith(`${item.href}/`);

              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-foreground hover:bg-secondary",
                    )}
                  >
                    {item.label}
                  </a>
                </Link>
              );
            })}

            <Link href="/loja/carrinho">
              <a className="relative inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-foreground shadow-sm">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">Carrinho</span>
                {itemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                ) : null}
              </a>
            </Link>

            <ThemeToggle compact className="rounded-full border-border bg-card/90 px-3" />

            {user ? (
              <>
                <Link href="/conta">
                  <a className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm md:hidden">
                    <Settings className="h-4 w-4" />
                  </a>
                </Link>
                {user.role === "admin" || user.role === "operador" ? (
                  <>
                    <Link href="/">
                      <a className="hidden rounded-full border border-border bg-card/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm md:inline-flex">
                        Painel
                      </a>
                    </Link>
                    <Link href="/">
                      <a className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm md:hidden">
                        <LayoutDashboard className="h-4 w-4" />
                      </a>
                    </Link>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm md:inline-flex"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm md:hidden"
                  aria-label="Sair da conta"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link href="/login">
                <a className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </a>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="brand-shell brand-grid mb-8 overflow-hidden px-6 py-7 md:px-8">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <CakeSlice className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">
              Universo Doce
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </main>

      <footer className="border-t border-border/70 bg-background/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <BrandLogo imageClassName="h-12 w-12" />
          <div className="text-sm leading-6 text-muted-foreground">
            <p>Encomendas com retirada ou entrega e pagamento em Pix manual.</p>
            <p>Catalogo publico pensado para compra, integrado ao fluxo real da confeitaria.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
