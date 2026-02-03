import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Panel admin</h1>
          <p className="text-muted-foreground">Control total de UZEED.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Usuarios",
            "Profesionales",
            "Categorías",
            "Establecimientos",
            "Servicios",
            "Ratings",
            "Chats",
            "Planes",
            "Auditoría"
          ].map((item) => (
            <Card key={item} className="glass">
              <CardContent className="space-y-3">
                <p className="text-lg font-semibold">{item}</p>
                <Button variant="outline">Gestionar</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
