import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Building2,
  Home,
  Users,
  CreditCard,
  DollarSign,
  AlertCircle,
  BarChart3,
  Bell,
  Settings,
  User,
  FileText,
  MessageCircle,
  Phone,
  Clock
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const { isAdmin, isTenant, profile } = useAuth();
  const { unreadCount } = useNotifications();
  const collapsed = state === "collapsed";

  // Admin navigation items
  const adminItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'units', title: 'Units', icon: Building2 },
    { id: 'tenants', title: 'Tenants', icon: Users },
    { id: 'billing', title: 'Billing', icon: CreditCard },
    { id: 'reports', title: 'Reports', icon: BarChart3 },
    { id: 'reminders', title: 'Reminders', icon: Bell },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  // Tenant navigation items
  const tenantItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'pay-rent', title: 'Pay Rent', icon: CreditCard },
    { id: 'history', title: 'History', icon: Clock },
    { id: 'notifications', title: 'Notifications', icon: Bell },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  const items = isAdmin ? adminItems : tenantItems;
  const isActive = (itemId: string) => activeTab === itemId;
  
  // For tenants with pending status, disable certain tabs
  const isPendingTenant = profile?.role === 'tenant' && profile?.status === 'pending';
  const isSuspendedTenant = profile?.role === 'tenant' && profile?.status === 'suspended';
  
  const isTabDisabled = (itemId: string) => {
    if (isPendingTenant && itemId !== 'dashboard') return true;
    if (isSuspendedTenant) return true;
    return false;
  };

  return (
    <Sidebar
      className={`transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } border-r border-border bg-sidebar`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className={`px-3 py-2 text-sidebar-foreground font-semibold ${collapsed ? 'hidden' : 'block'}`}>
            {isAdmin ? 'Admin Panel' : 'Tenant Portal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const disabled = isTabDisabled(item.id);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild={false}
                      onClick={() => !disabled && onTabChange(item.id)}
                      className={`
                        w-full justify-start h-10 px-3 rounded-lg transition-all duration-300 group
                        ${isActive(item.id) 
                          ? 'bg-gradient-to-r from-sidebar-accent/90 to-sidebar-accent backdrop-blur-sm text-sidebar-accent-foreground font-medium shadow-lg border border-sidebar-accent/20' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/30 hover:backdrop-blur-sm hover:border hover:border-sidebar-accent/10 hover:text-sidebar-accent-foreground hover:scale-105'
                        }
                        ${disabled 
                          ? 'opacity-40 cursor-not-allowed' 
                          : 'cursor-pointer hover:shadow-md'
                        }
                      `}
                      disabled={disabled}
                    >
                      <div className="relative">
                        <item.icon className={`
                          h-4 w-4 ${collapsed ? 'mx-auto' : 'mr-3'} shrink-0 
                          transition-colors duration-200
                          ${isActive(item.id) ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground'}
                        `} />
                        {/* Show red dot for notifications if there are unread messages */}
                        {item.id === 'notifications' && isTenant && unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                            <span className="text-destructive-foreground text-xs font-bold">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span className="truncate text-sm transition-all duration-300 group-hover:font-medium">
                            {item.title}
                          </span>
                          {/* Show notification count for non-collapsed sidebar */}
                          {item.id === 'notifications' && isTenant && unreadCount > 0 && (
                            <div className="ml-2 bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5 font-medium">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                          )}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}