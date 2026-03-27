import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
              <p className="text-sm text-muted-foreground">
                O caminho que você tentou abrir não existe ou foi removido.
              </p>
            </div>
          </div>
          <Link href="/">
            <Button className="w-full">Voltar para o dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
