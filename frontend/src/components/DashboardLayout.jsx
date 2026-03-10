import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import SEO from './SEO';
import { 
  FileText, 
  LayoutDashboard, 
  Key, 
  PlayCircle, 
  BarChart3, 
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
  HelpCircle,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/dashboard/keys', label: 'API Keys', icon: Key },
  { path: '/dashboard/playground', label: 'Playground', icon: PlayCircle },
  { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/dashboard/docs', label: 'Documentation', icon: BookOpen },
];

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const { user, logout, getAuthHeaders } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch subscription data for usage badge
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await axios.get(`${API}/subscription`, { 
          headers: getAuthHeaders() 
        });
        setSubscription(response.data);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };
    fetchSubscription();
  }, [getAuthHeaders]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate remaining extractions
  const getRemainingExtractions = () => {
    if (!subscription?.usage) return null;
    const { extractions_used, extractions_limit } = subscription.usage;
    if (extractions_limit === null) return 'Unlimited';
    return extractions_limit - extractions_used;
  };

  const remaining = getRemainingExtractions();

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SEO 
        title="Dashboard — ExtractAI"
        description="Manage your ExtractAI document extractions."
        url="https://www.extractai.io/dashboard"
        noIndex={true}
      />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-lg">ExtractAI</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {isActive(item) && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            ))}
            
            {/* Support Link */}
            <Link
              to="/dashboard/support"
              data-testid="nav-support"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4",
                location.pathname === '/dashboard/support'
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <HelpCircle className="w-5 h-5" />
              Support
              {location.pathname === '/dashboard/support' && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.company_name || 'Personal Account'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-border bg-card/50">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {/* Credits/Usage Badge */}
            {subscription && (
              <div 
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                data-testid="credits-badge"
              >
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {remaining === 'Unlimited' ? (
                    <span className="text-primary">Unlimited</span>
                  ) : remaining !== null ? (
                    <>
                      <span className={remaining <= 20 ? 'text-yellow-500' : 'text-primary'}>
                        {remaining}
                      </span>
                      <span className="text-muted-foreground"> left</span>
                    </>
                  ) : null}
                </span>
              </div>
            )}
            <Link to="/dashboard/docs">
              <Button variant="ghost" size="sm" data-testid="header-docs-btn">
                <BookOpen className="w-4 h-4 mr-2" />
                API Docs
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
