import * as React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dasbor Utama",
      url: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      title: "Kelola Acara",
      url: "/events",
      icon: <CalendarDays className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      title: "AI Writer Assistant",
      url: "/assistant",
      icon: <Sparkles className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      title: "Paket & Tagihan",
      url: "/billing",
      icon: <CreditCard className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      title: "Setelan Akun",
      url: "/settings",
      icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent className="pt-4 pb-4">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="py-2 gap-1">
        {/* Help Link */}
        <SidebarMenuButton tooltip="Bantuan & Dukungan" className="w-full justify-start gap-3">
          <HelpCircle className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.5} />
          <span className="font-sans text-xs text-ink-soft group-data-[collapsible=icon]:hidden">
            Bantuan & Dukungan
          </span>
        </SidebarMenuButton>

        {/* Collapse Sidebar Button */}
        <SidebarCollapseButton />
      </SidebarFooter>
    </Sidebar>
  );
}

// Subcomponent to handle collapsible sidebar states
function SidebarCollapseButton() {
  const { toggleSidebar, state } = useSidebar();

  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      tooltip={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
      className="w-full justify-start gap-3"
    >
      {state === "expanded" ? (
        <>
          <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span className="font-sans text-xs">Sembunyikan Sidebar</span>
        </>
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={1.5} />
      )}
    </SidebarMenuButton>
  );
}
