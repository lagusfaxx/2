"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatDetailPage() {
  const [message, setMessage] = useState("");
  const messages = [
    { id: 1, author: "Profesional", content: "Hola, ¿cómo estás?", time: "10:21" },
    { id: 2, author: "Tú", content: "Quiero solicitar un servicio.", time: "10:22" }
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Chat con Luna</h1>
          <p className="text-muted-foreground">Servicio 1:1 seguro.</p>
        </div>
        <Card>
          <CardContent className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">{msg.author} · {msg.time}</p>
                <div className="rounded-xl bg-white/10 px-4 py-2">{msg.content}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Al solicitar un servicio aceptas la advertencia legal y las condiciones de UZEED.
            </p>
            <Button className="w-full">Solicitar servicio</Button>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escribe tu mensaje" />
          <Button>Enviar</Button>
        </div>
      </div>
    </AppShell>
  );
}
