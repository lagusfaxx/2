import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const favorites = [
  { id: "1", name: "Luna Martínez", plan: "Premium" }
];

export default function FavoritesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Favoritos</h1>
          <p className="text-muted-foreground">Tus profesionales guardadas.</p>
        </div>
        {favorites.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Heart className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">Aún no tienes favoritas.</p>
              <Button asChild>
                <Link href="/buscar/profesionales">Explorar</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {favorites.map((favorite) => (
              <Card key={favorite.id}>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{favorite.name}</p>
                    <p className="text-sm text-muted-foreground">{favorite.plan}</p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/profesionales/${favorite.id}`}>Ver perfil</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
