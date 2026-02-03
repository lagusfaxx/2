import Link from "next/link";
import { Home, Search, Heart, MessageCircle } from "lucide-react";

const navItems = [
  { href: "/", icon: Home },
  { href: "/buscar/profesionales", icon: Search },
  { href: "/favoritos", icon: Heart },
  { href: "/chat", icon: MessageCircle }
];

export function BottomNav() {
  return (
    <div className="fixed bottom-4 left-1/2 z-20 flex w-[92%] -translate-x-1/2 items-center justify-between rounded-2xl border border-white/10 bg-black/60 px-6 py-3 shadow-glow backdrop-blur lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-white">
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}
    </div>
  );
}
