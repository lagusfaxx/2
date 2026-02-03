import { Suspense } from "react";
import EstablecimientosClient from "./EstablecimientosClient";

export default function BuscarEstablecimientosPage() {
  return (
    <Suspense fallback={<div className="text-white/70">Cargando búsqueda...</div>}>
      <EstablecimientosClient />
    </Suspense>
  );
}
