import { Suspense } from "react";
import ProfesionalesClient from "./ProfesionalesClient";

export default function BuscarProfesionalesPage() {
  return (
    <Suspense fallback={<div className="text-white/70">Cargando búsqueda...</div>}>
      <ProfesionalesClient />
    </Suspense>
  );
}
