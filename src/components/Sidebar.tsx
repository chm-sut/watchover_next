
"use client";
import { useState } from 'react';
import { BarChart3, Home, MessageCircle, Cloud, Ticket } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/utils/mockAuth';

const menuItems = [
  {
    name: "Analytics",
    icon: BarChart3,
    path: "/analytics"
  },
  {
    name: "SLA Overview", 
    icon: Home,
    path: "/sla-overview"
  },
  {
    name: "Live Conversation",
    icon: MessageCircle,
    path: "/live-conversation"
  },
  {
    name: "Cloud Service",
    icon: Cloud,
    path: "/cloud-service"
  },
  {
    name: "Ticket Lifecycle",
    icon: Ticket,
    path: "/ticket"
  }
];

/**
 * SideBar Layout Component
 * 
 * Centralizes sidebar positioning and responsive behavior across all pages.
 * Can be used as a layout wrapper or standalone component.
 */
interface SideBarProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export default function SideBar({ children, isOpen, onToggle }: SideBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = getCurrentUser();
  
  // Internal state for sidebar if not controlled externally
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const sidebarOpen = isOpen !== undefined ? isOpen : internalSidebarOpen;
  const setSidebarOpen = onToggle || setInternalSidebarOpen;

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Get page title based on current route
  const getPageTitle = () => {
    switch (pathname) {
      case '/analytics':
        return 'Analytics';
      case '/sla-overview':
        return 'SLA Overview';
      case '/live-conversation':
        return 'Live Conversation';
      case '/cloud-service':
        return 'Cloud Service';
      case '/ticket':
        return 'Ticket Lifecycle';
      case '/ticket/ticket-info':
        return 'Ticket Lifecycle';
      default:
        return 'WatchOver';
    }
  };

  // If used as layout (with children), render full layout
  if (children) {
    // Don't show sidebar layout on login page
    if (pathname === '/') {
      return <>{children}</>;
    }

    return (
      <div
        className="relative flex h-screen w-screen font-sans text-white bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url('/blur_bg.png')` }}
      >
        <div className="rounded-xl">
          <SideBar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 p-4 md:p-6 ml-0 md:ml-0 w-full z-10 transition-all duration-300">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 overflow-hidden">
            <h1 className="font-heading text-h5 sm:text-h4 text-logoWhite truncate">{getPageTitle()}</h1>
            <div className="flex sm:flex items-center gap-2 flex-shrink-0">
              <span className="text-logoWhite hidden sm:inline">{user.name}</span>
              <button 
                onClick={() => console.log('Logout clicked')}
                className="text-logoWhite hover:text-logoRed transition-colors"
                title="Logout"
              >
                ⏻
              </button>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    );
  }

  // Otherwise render just the sidebar component
  return (
    <>
      {/* Dim Background with Blur */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-20"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-4 left-3 md:left-4 z-30 transition-transform duration-300 h-[calc(100%-2rem)]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          w-60 sm:w-64 md:w-72 xxl:w-[18rem]
        `}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="h-full w-full rounded-xl overflow-hidden">
          <div className="h-full w-full bg-logoBlack bg-opacity-50 text-white flex flex-col gap-4 backdrop-blur-sm border-b border-l border-white border-opacity-20 rounded-2xl">
            <div className="mb-6 p-6 flex justify-center">
              <img src="/icons/watchover_logo.svg" alt="Watchover Logo" className="w-auto h-auto" />
            </div>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.path;
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`font-heading rounded-none text-sm sm:text-base lg:text-h5 text-left px-3 py-2 flex items-center gap-3 transition-colors ${
                    isActive
                      ? "bg-logoRed text-white"
                      : "bg-transparent hover:bg-logoRed hover:text-white"
                  }`}
                >
                  <span className="flex-shrink-0">
                    <IconComponent size={20} />
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover Trigger Area for Sidebar */}
      <div
        className="fixed top-0 left-0 w-4 h-full z-20"
        onMouseEnter={() => setSidebarOpen(true)}
      />
    </>
  );
}
