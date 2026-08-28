"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Calendar, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "主頁", path: "/", icon: Home },
    { name: "組局", path: "/create", icon: PlusCircle },
    { name: "我的局", path: "/schedule", icon: Calendar },
    { name: "個人", path: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 px-6 py-2 pb-[env(safe-area-inset-bottom,16px)]">
      <ul className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <li key={item.name}>
              <Link 
                href={item.path} 
                className="flex flex-col items-center justify-center p-2 gap-1"
              >
                <Icon 
                  size={24} 
                  className={`transition-colors ${
                    isActive ? "text-primary" : "text-muted hover:text-secondary"
                  }`} 
                />
                <span 
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}