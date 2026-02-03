import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categories = [
  { name: "Masajes", type: "PROFESSIONAL" },
  { name: "Belleza", type: "PROFESSIONAL" },
  { name: "Spa", type: "ESTABLISHMENT" },
  { name: "Wellness", type: "ESTABLISHMENT" }
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-hero p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        <Image
          src="/hero-placeholder.svg"
          alt="UZEED city"
          fill
          className="-z-10 object-cover opacity-60"
        />
        <div className="relative z-10 max-w-xl space-y-4">
          <Badge className="bg-white/10">Directorio premium</Badge>
          <h1 className="text-4xl font-semibold">Encuentra profesionales y espacios premium a tu medida.</h1>
          <p className="text-muted-foreground">
            Reserva servicios, chatea en tiempo real y gestiona tus favoritos en una experiencia oscura y elegante.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/buscar/profesionales">Buscar profesionales</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/buscar/establecimientos">Buscar establecimientos</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Categorías destacadas</h2>
          <span className="text-sm text-muted-foreground">Elige un tipo para iniciar</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Card key={category.name} className="glass">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.type}</p>
                  </div>
                  <Badge>{category.type === "PROFESSIONAL" ? "Pro" : "Est"}</Badge>
                </div>
                <Button asChild variant="secondary" className="w-full">
                  <Link
                    href={
                      category.type === "PROFESSIONAL" ? "/buscar/profesionales" : "/buscar/establecimientos"
                    }
                  >
                    Explorar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
