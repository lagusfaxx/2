import Link from "next/link";
import Image from "next/image";
import { Home, Search, Heart, MessageCircle, Shield, Sparkles } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/buscar/profesionales", label: "Buscar", icon: Search },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/panel-profesional", label: "Panel Pro", icon: Sparkles },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-white/5 bg-gradient-to-b from-black/40 via-black/20 to-black/60 px-6 py-8 lg:flex">
      <div className="flex items-center gap-3">
        <Image src="/logo-placeholder.svg" alt="UZEED" width={40} height={40} />
        <div>
          <p className="text-lg font-semibold">UZEED</p>
          <p className="text-xs text-muted-foreground">Premium Directory</p>
        </div>
      </div>
      <nav className="mt-10 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-white/5 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
