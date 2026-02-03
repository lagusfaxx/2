import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle } from "lucide-react";

export default function ProfessionalProfilePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-purple-700/50 to-indigo-700/50" />
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold">Luna Martínez</p>
                <p className="text-sm text-muted-foreground">Categoría: Masajes</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-200">Online</Badge>
            </div>
            <p className="text-muted-foreground">
              Especialista en terapias relajantes con enfoque holístico. Más de 8 años de experiencia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>
                <Heart className="h-4 w-4" />
                Favorito
              </Button>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4" />
                Enviar mensaje
              </Button>
            </div>
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
