import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md glass">
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <Image src="/logo-placeholder.svg" alt="UZEED" width={48} height={48} />
            <div>
              <p className="text-lg font-semibold">UZEED</p>
              <p className="text-xs text-muted-foreground">Crear cuenta</p>
            </div>
          </div>
          <div className="space-y-3">
            <Input placeholder="Nombre" />
            <Input placeholder="Email" type="email" />
            <Input placeholder="Password" type="password" />
          </div>
          <Button className="w-full">Crear cuenta</Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link href="/login" className="text-primary">Ingresar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
