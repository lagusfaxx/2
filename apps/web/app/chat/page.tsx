import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";

const conversations = [
  { id: "1", name: "Luna Martínez", lastMessage: "¿Te confirmo la cita?" }
];

export default function ChatPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Chat</h1>
          <p className="text-muted-foreground">Conversaciones en tiempo real.</p>
        </div>
        <div className="grid gap-4">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/chat/${conversation.id}`}>
              <Card className="glass">
                <CardContent>
                  <p className="text-lg font-semibold">{conversation.name}</p>
                  <p className="text-sm text-muted-foreground">{conversation.lastMessage}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
