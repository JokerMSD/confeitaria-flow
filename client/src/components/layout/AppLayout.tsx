import { Link, useLocation } from "wouter";
import {
  BookOpen,
  ChefHat,
  Home,
  LogOut,
  PackageSearch,
  Store,
  User,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { authQueryKeys } from "@/features/auth/lib/auth-query-keys";
import { queryClient } from "@/lib/queryClient";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const authSessionQuery = useAuthSession();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    if (!window.confirm("Deseja sair da sua conta?")) {
      return;
    }

    try {
      await logoutMutation.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.session(),
      });
      setLocation("/login");
    } catch {
      toast({
        title: "Não foi possível sair",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/fila", label: "Fila", icon: Home },
    { href: "/producao/previsao", label: "Producao", icon: ChefHat },
    { href: "/clientes", label: "Clientes", icon: User },
    { href: "/usuarios", label: "Usuários", icon: User },
    { href: "/receitas", label: "Receitas", icon: BookOpen },
    { href: "/catalogo", label: "Catálogo", icon: Store },
    { href: "/estoque", label: "Estoque", icon: PackageSearch },
    { href: "/caixa", label: "Caixa", icon: Wallet },
  ];

  const user = authSessionQuery.data?.data;

  return (
    <aside className="sticky left-0 top-0 hidden min-h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">
          D
        </div>
        <div>
          <h1 className="font-display text-lg font-bold leading-tight text-sidebar-foreground">
            Doce Gestao
          </h1>
          <p className="text-xs text-sidebar-foreground/60">Confeitaria</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-4">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover-elevate",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive
                      ? "text-primary-foreground"
                      : "text-sidebar-foreground/60",
                  )}
                />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-4">
        <div className="mb-4 flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src="https://i.pravatar.cc/150?u=admin" />
            <AvatarFallback>
              {(user?.name?.slice(0, 2) ?? "AD").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {user?.name ?? "Usuário"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {user?.email ?? "usuario@docegestao.com"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/fila", label: "Fila", icon: Home },
    { href: "/producao/previsao", label: "Producao", icon: ChefHat },
    { href: "/clientes", label: "Clientes", icon: User },
    { href: "/receitas", label: "Receitas", icon: BookOpen },
    { href: "/catalogo", label: "Catálogo", icon: Store },
    { href: "/estoque", label: "Estoque", icon: PackageSearch },
    { href: "/caixa", label: "Caixa", icon: Wallet },
  ];

  return (
    <nav className="bottom-nav-glass fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden">
      <div className="flex items-center justify-between gap-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl transition-all",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "rounded-xl p-1.5 transition-all duration-300",
                    isActive ? "bg-primary/10" : "bg-transparent",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      isActive ? "scale-110" : "scale-100",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "mt-1 max-w-full truncate px-1 text-[9px] font-medium transition-all duration-300",
                    isActive ? "font-semibold opacity-100" : "opacity-80",
                  )}
                >
                  {item.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader({ title }: { title: string }) {
  const authSessionQuery = useAuthSession();
  const user = authSessionQuery.data?.data;

  return (
    <header className="sticky left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 pt-safe backdrop-blur-md md:hidden">
      <h1 className="font-display text-xl font-bold text-foreground">
        {title}
      </h1>
      <Avatar className="h-8 w-8 border border-border">
        <AvatarImage src="https://i.pravatar.cc/150?u=admin" />
        <AvatarFallback>
          {(user?.name?.slice(0, 2) ?? "AD").toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

export function AppLayout({
  children,
  title = "Dashboard",
  contentClassName,
}: {
  children: React.ReactNode;
  title?: string;
  contentClassName?: string;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <MobileHeader title={title} />
        <div
          className={cn(
            "mx-auto flex-1 w-full max-w-7xl animate-fade-in p-4 md:p-8 md:pt-8",
            contentClassName,
          )}
        >
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
