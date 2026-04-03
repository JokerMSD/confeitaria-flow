import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Route, Switch, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Pedidos from "@/pages/Pedidos";
import Fila from "@/pages/Fila";
import Estoque from "@/pages/Estoque";
import Caixa from "@/pages/Caixa";
import PedidoForm from "@/pages/PedidoForm";
import CaixaForm from "@/pages/CaixaForm";
import EstoqueForm from "@/pages/EstoqueForm";
import EstoqueMovimentacao from "@/pages/EstoqueMovimentacao";
import Login from "@/pages/Login";
import Receitas from "@/pages/Receitas";
import ReceitaForm from "@/pages/ReceitaForm";
import Catalogo from "@/pages/Catalogo";
import Clientes from "@/pages/Clientes";
import Cliente from "@/pages/Cliente";
import ClienteForm from "@/pages/ClienteForm";
import Usuarios from "@/pages/Usuarios";
import Usuario from "@/pages/Usuario";
import PrevisaoProducao from "@/pages/PrevisaoProducao";
import PublicStoreHome from "@/pages/PublicStoreHome";
import PublicCatalog from "@/pages/PublicCatalog";
import PublicProductDetail from "@/pages/PublicProductDetail";
import PublicCart from "@/pages/PublicCart";
import PublicCheckout from "@/pages/PublicCheckout";
import MinhaConta from "@/pages/MinhaConta";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";

function isStaffRole(role?: string) {
  return role === "admin" || role === "operador";
}

function isPublicFacingPath(path: string) {
  return (
    path === "/" ||
    path === "/login" ||
    path === "/conta" ||
    path.startsWith("/loja") ||
    path.startsWith("/conta/")
  );
}

function PublicFacingSwitch({ includeLogin }: { includeLogin: boolean }) {
  return (
    <Switch>
      <Route path="/" component={PublicStoreHome} />
      <Route path="/loja" component={PublicStoreHome} />
      <Route path="/loja/catalogo" component={PublicCatalog} />
      <Route path="/loja/produtos/:id" component={PublicProductDetail} />
      <Route path="/loja/carrinho" component={PublicCart} />
      <Route path="/loja/checkout" component={PublicCheckout} />
      <Route path="/conta" component={MinhaConta} />
      {includeLogin ? <Route path="/login" component={Login} /> : null}
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminSwitch() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pedidos" component={Pedidos} />
      <Route path="/pedidos/:id" component={PedidoForm} />
      <Route path="/fila" component={Fila} />
      <Route path="/producao/previsao" component={PrevisaoProducao} />
      <Route path="/estoque" component={Estoque} />
      <Route path="/estoque/novo" component={EstoqueForm} />
      <Route path="/estoque/:id/editar" component={EstoqueForm} />
      <Route path="/estoque/:id" component={EstoqueMovimentacao} />
      <Route path="/caixa" component={Caixa} />
      <Route path="/caixa/:id" component={CaixaForm} />
      <Route path="/receitas" component={Receitas} />
      <Route path="/catalogo" component={Catalogo} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/clientes/novo" component={ClienteForm} />
      <Route path="/clientes/:id/editar" component={ClienteForm} />
      <Route path="/clientes/:id" component={Cliente} />
      <Route path="/usuarios" component={Usuarios} />
      <Route path="/usuarios/novo" component={Usuario} />
      <Route path="/usuarios/:id" component={Usuario} />
      <Route path="/receitas/:id" component={ReceitaForm} />
      <Route path="/catalogo/:id" component={ReceitaForm} />
      <Route path="/conta" component={MinhaConta} />
      <Route path="/loja" component={PublicStoreHome} />
      <Route path="/loja/catalogo" component={PublicCatalog} />
      <Route path="/loja/produtos/:id" component={PublicProductDetail} />
      <Route path="/loja/carrinho" component={PublicCart} />
      <Route path="/loja/checkout" component={PublicCheckout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate() {
  const [location, setLocation] = useLocation();
  const authSessionQuery = useAuthSession();
  const session = authSessionQuery.data?.data ?? null;
  const isStaff = isStaffRole(session?.role);

  useEffect(() => {
    if (authSessionQuery.isLoading) {
      return;
    }

    if (!session) {
      if (location === "/conta" || location.startsWith("/conta/")) {
        setLocation("/login");
        return;
      }

      if (!isPublicFacingPath(location)) {
        setLocation("/");
      }
      return;
    }

    if (location === "/login") {
      setLocation(isStaff ? "/" : "/conta");
      return;
    }

    if (!isStaff && !isPublicFacingPath(location)) {
      setLocation("/");
    }
  }, [authSessionQuery.isLoading, isStaff, location, session, setLocation]);

  if (authSessionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando sessao...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <PublicFacingSwitch includeLogin />;
  }

  if (isStaff) {
    return <AdminSwitch />;
  }

  return <PublicFacingSwitch includeLogin={false} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthGate />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
