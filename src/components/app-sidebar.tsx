import React from "react";
import { Skull, ShieldAlert, LifeBuoy, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: () => api('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear();
      navigate('/login');
    }
  });
  return (
    <Sidebar className="border-r-4 border-black bg-zinc-950">
      <SidebarHeader className="border-b-4 border-black p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-red-600 border-2 border-white flex items-center justify-center">
            <Skull className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black uppercase tracking-tighter text-white">RUTHLESS_V1</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500 font-black uppercase text-[10px] px-2 mb-2">OPERATIONS</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/"} className="rounded-none border-2 border-transparent hover:border-white transition-all">
                <Link to="/" className="flex items-center gap-2 font-black uppercase">
                  <LayoutDashboard className="h-4 w-4" /> <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/shame"} className="rounded-none border-2 border-transparent hover:border-red-600 transition-all text-red-500 hover:text-red-600">
                <Link to="/shame" className="flex items-center gap-2 font-black uppercase">
                  <Skull className="h-4 w-4" /> <span>Criminal Record</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500 font-black uppercase text-[10px] px-2 mb-2">SYSTEM</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="rounded-none opacity-50 cursor-not-allowed">
                <Settings className="h-4 w-4" /> <span className="uppercase font-black">Settings (Locked)</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="rounded-none">
                <LifeBuoy className="h-4 w-4" /> <span className="uppercase font-black">Get Insulted</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t-4 border-black p-4 bg-zinc-900">
        <div className="text-[8px] font-black uppercase text-zinc-600 mb-2 leading-tight">
          BUILD_2025.04.24_BETA
          <br />STATE: DISAPPOINTING
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton 
               onClick={() => logoutMutation.mutate()}
               disabled={logoutMutation.isPending}
               className="bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-900"
             >
               <LogOut className="h-4 w-4" /> <span className="uppercase font-black">Surrender</span>
             </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}