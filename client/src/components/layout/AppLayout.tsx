import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  ClipboardList,
  PackageSearch,
  Wallet,
  LogOut,
  BookOpen,
  Store,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.session() });
      setLocation("/login");
    } catch {
      toast({
        title: "Nao foi possivel sair",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/fila", label: "Fila", icon: ClipboardList },
    { href: "/receitas", label: "Receitas", icon: BookOpen },
    { href: "/catalogo", label: "Catalogo", icon: Store },
    { href: "/estoque", label: "Estoque", icon: PackageSearch },
    { href: "/caixa", label: "Caixa", icon: Wallet },
  ];

  const user = authSessionQuery.data?.data;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0 left-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
          D
        </div>
        <div>
          <h1 className="font-display font-bold text-lg text-sidebar-foreground leading-tight">
            Doce Gestao
          </h1>
          <p className="text-xs text-sidebar-foreground/60">Confeitaria</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  "text-sm font-medium hover-elevate",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
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

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="w-9 h-9 border border-border">
            <AvatarImage src="https://i.pravatar.cc/150?u=admin" />
            <AvatarFallback>
              {(user?.name?.slice(0, 2) ?? "AD").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-sidebar-foreground">
              {user?.name ?? "Usuario"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email ?? "usuario@docegestao.com"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/fila", label: "Fila", icon: ClipboardList },
    { href: "/receitas", label: "Receitas", icon: BookOpen },
    { href: "/catalogo", label: "Catalogo", icon: Store },
    { href: "/estoque", label: "Estoque", icon: PackageSearch },
    { href: "/caixa", label: "Caixa", icon: Wallet },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bottom-nav-glass pb-safe">
      <div className="flex items-center justify-between gap-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center h-14 rounded-2xl transition-all",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-all duration-300",
                    isActive ? "bg-primary/10" : "bg-transparent",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      isActive ? "scale-110" : "scale-100",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "mt-1 max-w-full truncate px-1 text-[9px] font-medium transition-all duration-300",
                    isActive ? "opacity-100 font-semibold" : "opacity-80",
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
    <header className="md:hidden sticky top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border py-4 px-6 flex items-center justify-between pt-safe">
      <h1 className="font-display font-bold text-xl text-foreground">
        {title}
      </h1>
      <Avatar className="w-8 h-8 border border-border">
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
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <MobileHeader title={title} />
        <div className="flex-1 p-4 md:p-8 md:pt-8 w-full max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
