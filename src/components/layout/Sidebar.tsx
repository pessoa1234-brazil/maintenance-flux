import { LayoutDashboard, KanbanSquare, Archive, BarChart3, Building2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pipeline", label: "Pipeline de OS", icon: KanbanSquare },
  { id: "empreendimentos", label: "Empreendimentos", icon: Building2 },
  { id: "ativos", label: "Cofre de Ativos", icon: Archive },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
];

export const Sidebar = ({ activeView, onNavigate }: SidebarProps) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!roles);
    };

    checkAdminRole();
  }, []);

  const allNavigationItems = [
    ...navigationItems,
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: Shield }] : [])
  ];

  const handleNavigate = (view: string) => {
    if (view === "admin") {
      window.location.href = "/admin";
    } else {
      onNavigate(view);
    }
  };

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-sidebar shadow-lg z-10 border-r border-sidebar-border">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Manutenção360</h1>
      </div>
      <ul className="mt-6 space-y-2 px-3">
        {allNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex items-center w-full p-4 rounded-lg transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "bg-accent text-accent-foreground font-semibold"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
