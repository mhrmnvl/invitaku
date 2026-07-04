import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import * as React from "react";
import { cn } from "@/lib/utils";
import { checkSessionFn } from "@/lib/auth-rpc";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BadgeCheckIcon, CreditCardIcon, LogOutIcon } from "lucide-react";

export const Route = createFileRoute("/_layout")({
  beforeLoad: async () => {
    try {
      const { authenticated } = await checkSessionFn();
      if (!authenticated) {
        throw redirect({
          to: "/login",
        });
      }
    } catch {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async () => {
    try {
      const { getEvents } = await import("@/lib/events-api");
      const res = await getEvents({ data: {} });
      return { events: res?.data || [] };
    } catch (e) {
      console.error("Gagal memuat acara untuk sidebar:", e);
      return { events: [] };
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const matches = useRouterState({ select: (s) => s.matches });
  const [isScrolled, setIsScrolled] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLElement>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    setIsMounted(true);
    // Verifikasi session client-side
    supabase.auth
      .getSession()
      .then(({ data: { session: activeSession } }) => {
        if (!activeSession) {
          window.location.href = "/login";
        } else if (activeSession) {
          setCurrentUser(activeSession.user);
          // Set access token cookie
          document.cookie = `sb-access-token=${activeSession.access_token}; path=/; max-age=${activeSession.expires_in}; SameSite=Lax`;
          setChecking(false);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat sesi:", err);
        window.location.href = "/login";
      });

    // Dengarkan perubahan state auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setCurrentUser(session.user);
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax`;
      } else {
        setCurrentUser(null);
        document.cookie = `sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
      if (event === "SIGNED_OUT" || !session) {
        window.location.href = "/login";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 0);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [currentPath]);

  const getBreadcrumbItems = () => {
    const items = [{ label: "Workspace", to: "/dashboard" }];

    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length === 0) {
      items.push({ label: "Overview", to: "/dashboard" });
      return items;
    }

    const rootPage = parts[0];
    if (rootPage === "dashboard") {
      items.push({ label: "Overview", to: "/dashboard" });
      return items;
    }

    const formatPageName = (str: string) => {
      if (str === "rsvp") return "RSVP";
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    if (rootPage === "events") {
      items.push({ label: "Events", to: "/events" });
      if (parts.length > 1) {
        if (parts[1] === "new") {
          items.push({ label: "New", to: "/events/new" });
        } else {
          const eventMatch = matches.find((m) => m.routeId === "/_layout/events/$eventId");
          const activeEvent = (eventMatch?.loaderData as any)?.event;
          const eventName = activeEvent ? activeEvent.name : parts[1];
          const eventId = parts[1];
          items.push({ label: eventName, to: `/events/${eventId}` });

          if (parts.length > 2) {
            items.push({
              label: formatPageName(parts[2]),
              to: `/events/${eventId}/${parts[2]}`,
            });
          }
        }
      }
    } else {
      items.push({ label: formatPageName(rootPage), to: `/${rootPage}` });
      if (parts.length > 1) {
        items.push({ label: formatPageName(parts[1]), to: `/${rootPage}/${parts[1]}` });
      }
    }

    return items;
  };

  const userEmail = currentUser?.email || "";
  const userName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    userEmail.split("@")[0] ||
    "User";
  const userInitials =
    userName
      .trim()
      .split(/\s+/)
      .map((part: string) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";
  const avatarUrl = currentUser?.user_metadata?.avatar_url || "";

  if (!isMounted || checking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-sidebar">
        <div className="text-xs font-mono text-ink-soft animate-pulse">
          Menghubungkan ke Invitaku...
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex flex-col h-screen w-full bg-sidebar text-ink font-sans overflow-hidden">
          {/* GitLab-style Sticky Top Header */}
          <header className="sticky top-0 z-50 flex h-10 w-full items-center justify-between bg-sidebar px-6 shrink-0 border-b border-rule/30">
            {/* Left: Mobile sidebar trigger + Brand logo */}
            <div className="flex items-center gap-2">
              {/* Mobile-only hamburger to open sidebar Sheet */}
              <SidebarTrigger className="md:hidden text-ink-soft hover:text-ink -ml-1" />
              <Link to="/dashboard" className="flex items-center">
                <img src="/logo.png" alt="Invitaku" className="h-16 w-auto object-contain -my-3" />
              </Link>
            </div>

            {/* Right: User Profile Avatar Dropdown */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:bg-sidebar/80 px-2 py-1 transition-colors duration-150 focus:outline-none cursor-pointer">
                    <span className="text-[11px] font-medium text-ink-soft hidden sm:inline-block leading-none">
                      {userName}
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={avatarUrl} alt={userName} />
                      <AvatarFallback className="text-[8px] font-mono">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end" sideOffset={8}>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex flex-col px-3 py-2 text-left">
                      <span className="font-medium text-xs text-ink truncate">{userName}</span>
                      <span className="text-[10px] text-ink-soft truncate">{userEmail}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 cursor-pointer text-xs"
                      >
                        <BadgeCheckIcon className="size-3.5" />
                        <span>Account Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/billing"
                        className="flex items-center gap-2 cursor-pointer text-xs"
                      >
                        <CreditCardIcon className="size-3.5" />
                        <span>Billing</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/login";
                    }}
                    className="flex items-center gap-2 cursor-pointer text-xs text-danger focus:text-danger-foreground focus:bg-danger"
                  >
                    <LogOutIcon className="size-3.5" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Under-header Layout: Sidebar + Main Content Inset */}
          <div className="flex flex-1 w-full overflow-hidden h-[calc(100vh-2.5rem)]">
            {/* Left: AppSidebar (flat/merged, pt-10 sits it below the header on desktop) */}
            <AppSidebar className="pt-10" />

            {/* Right: Inset Wrapper for Content (manually styled to float as a card) */}
            <SidebarInset className="flex flex-col flex-1 min-w-0 bg-white m-2 md:m-2 md:ml-0 md:peer-data-[state=collapsed]:ml-2 rounded-2xl shadow-sm overflow-hidden">
              {/* Sticky Breadcrumb Bar (inside the rounded inset canvas) */}
              <div
                className={cn(
                  "sticky top-0 z-40 flex h-8 items-center justify-between bg-white/95 backdrop-blur-xs px-4 shrink-0 transition-all duration-150",
                  isScrolled ? "border-b border-rule shadow-xs" : "border-b-0",
                )}
              >
                <Breadcrumb>
                  <BreadcrumbList>
                    {getBreadcrumbItems().map((item, index, arr) => {
                      const isLast = index === arr.length - 1;
                      return (
                        <React.Fragment key={index}>
                          <BreadcrumbItem>
                            {isLast ? (
                              <BreadcrumbPage className="text-xs text-primary">
                                {item.label}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link
                                  to={item.to}
                                  className="text-xs text-ink-soft hover:text-ink transition-colors duration-150"
                                >
                                  {item.label}
                                </Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Page Route Canvas */}
              <main ref={scrollContainerRef} className="flex-1 px-4 py-6 overflow-y-auto">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
