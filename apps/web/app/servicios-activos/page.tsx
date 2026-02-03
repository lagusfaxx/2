import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const services = [
  { id: "1", status: "PENDING_APPROVAL" },
  { id: "2", status: "PENDING_REVIEW" }
];

export default function ActiveServicesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Servicios activos</h1>
          <p className="text-muted-foreground">Gestiona solicitudes y calificaciones.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">Servicio #{service.id}</p>
                  <Badge>{service.status}</Badge>
                </div>
                <div className="flex gap-3">
                  <Button size="sm" variant="outline">Ver perfil</Button>
                  <Button size="sm" variant="ghost">Mensaje</Button>
                  {service.status === "PENDING_REVIEW" && (
                    <Button size="sm">Calificar</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
