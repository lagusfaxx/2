import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProfessionalPanelPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Panel profesional</h1>
          <p className="text-muted-foreground">Gestiona tu perfil, servicios y suscripción.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="glass">
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge className="bg-emerald-500/20 text-emerald-200">Perfil activo</Badge>
              <Button variant="outline">Cambiar estado</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Solicitudes</p>
              <p className="text-2xl font-semibold">12</p>
              <Button>Ver solicitudes</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Suscripción</p>
              <p className="text-2xl font-semibold">Gold</p>
              <Button variant="outline">Gestionar Khipu</Button>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">Editar perfil</p>
            <p className="text-muted-foreground">Sube galería, actualiza descripción y categoría.</p>
            <Button variant="secondary">Editar ahora</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
