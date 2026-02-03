import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const professionals = [
  { id: "1", name: "Luna Martínez", rating: 4.8, plan: "Premium", active: true },
  { id: "2", name: "Sofía Díaz", rating: 4.4, plan: "Gold", active: false },
  { id: "3", name: "Valeria Rojas", rating: 4.9, plan: "Silver", active: true }
];

export default function ProfessionalsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Profesionales</h1>
            <p className="text-muted-foreground">Filtra por rango, género, plan y estado.</p>
          </div>
          <div className="flex w-full max-w-md gap-3">
            <Input placeholder="Buscar por nombre" />
            <Button variant="outline">Filtrar</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {professionals.map((pro) => (
            <Card key={pro.id} className={pro.active ? "gradient-border" : "opacity-70"}>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">{pro.name}</p>
                    <p className="text-sm text-muted-foreground">Rating {pro.rating}</p>
                  </div>
                  <Badge className={pro.active ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"}>
                    {pro.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/10">{pro.plan}</Badge>
                  <Button asChild size="sm">
                    <Link href={`/profesionales/${pro.id}`}>Ver perfil</Link>
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
