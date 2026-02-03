import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const establishments = [
  { id: "1", name: "Aura Spa", rating: 4.7, city: "Santiago" },
  { id: "2", name: "Lumi Studio", rating: 4.5, city: "Valparaíso" }
];

export default function EstablishmentsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Establecimientos</h1>
            <p className="text-muted-foreground">Filtra por rango, rating y categoría.</p>
          </div>
          <div className="flex w-full max-w-md gap-3">
            <Input placeholder="Buscar por ciudad" />
            <Button variant="outline">Filtrar</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {establishments.map((place) => (
            <Card key={place.id} className="glass">
              <CardContent className="space-y-4">
                <div>
                  <p className="text-lg font-semibold">{place.name}</p>
                  <p className="text-sm text-muted-foreground">{place.city}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge>Rating {place.rating}</Badge>
                  <Button asChild size="sm">
                    <Link href={`/establecimientos/${place.id}`}>Ver ficha</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
