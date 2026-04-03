import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Switch, Route, useLocation } from "wouter";
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
import Usuarios from "@/pages/Usuarios";
import Usuario from "@/pages/Usuario";
import PrevisaoProducao from "@/pages/PrevisaoProducao";
import PublicStoreHome from "@/pages/PublicStoreHome";
import PublicCatalog from "@/pages/PublicCatalog";
import PublicProductDetail from "@/pages/PublicProductDetail";
import PublicCart from "@/pages/PublicCart";
import PublicCheckout from "@/pages/PublicCheckout";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";

function AuthGate() {
  const [location, setLocation] = useLocation();
  const authSessionQuery = useAuthSession();
  const isPublicRoute =
    location === "/loja" ||
    location.startsWith("/loja/") ||
    location.startsWith("/loja?");

  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/loja" component={PublicStoreHome} />
        <Route path="/loja/catalogo" component={PublicCatalog} />
        <Route path="/loja/produtos/:id" component={PublicProductDetail} />
        <Route path="/loja/carrinho" component={PublicCart} />
        <Route path="/loja/checkout" component={PublicCheckout} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  useEffect(() => {
    if (authSessionQuery.data?.data && location === "/login") {
      setLocation("/");
    }
  }, [authSessionQuery.data?.data, location, setLocation]);

  useEffect(() => {
    if (
      !authSessionQuery.isLoading &&
      !authSessionQuery.data?.data &&
      location !== "/login"
    ) {
      setLocation("/login");
    }
  }, [
    authSessionQuery.data?.data,
    authSessionQuery.isLoading,
    location,
    setLocation,
  ]);

  if (location === "/login" && !authSessionQuery.data?.data) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    );
  }

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

  if (!authSessionQuery.data?.data && location !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Redirecionando para o login...</span>
        </div>
      </div>
    );
  }

  if (authSessionQuery.data?.data && location === "/login") {
    return <Home />;
  }

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
      <Route path="/clientes/:id" component={Cliente} />
      <Route path="/usuarios" component={Usuarios} />
      <Route path="/usuarios/:id" component={Usuario} />
      <Route path="/usuarios/novo" component={Usuario} />
      <Route path="/receitas/:id" component={ReceitaForm} />
      <Route path="/catalogo/:id" component={ReceitaForm} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
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
