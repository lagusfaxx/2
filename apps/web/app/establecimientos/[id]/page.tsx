import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EstablishmentProfilePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-fuchsia-600/50 to-purple-600/40" />
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">Aura Spa</p>
                <p className="text-sm text-muted-foreground">Santiago · Av. Delicias 123</p>
              </div>
              <Badge>4.7 estrellas</Badge>
            </div>
            <p className="text-muted-foreground">
              Espacio premium con terapias holísticas, sauna y rituales personalizados.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Galería</p>
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 rounded-xl bg-white/10" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
