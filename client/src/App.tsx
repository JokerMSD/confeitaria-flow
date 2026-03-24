import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/pedidos" component={Pedidos}/>
      <Route path="/pedidos/:id" component={PedidoForm}/>
      <Route path="/fila" component={Fila}/>
      <Route path="/estoque" component={Estoque}/>
      <Route path="/caixa" component={Caixa}/>
      <Route path="/caixa/:id" component={CaixaForm}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;