import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Brain, Workflow, User, LogIn, KeyRound, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar: React.FC = () => {
    const location = useLocation();
    const {
        authenticated,
        provider,
        userName,
        userEmail,
        roles,
        isInstructor,
        loading,
        fetchSession,
        startGoogleLogin,
        logout,
    } = useAuthStore();

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const navItems = [
        {
            label: 'Documents',
            path: '/documents',
            icon: <FileText className="w-4 h-4" />,
            instructorOnly: true,
        },
        {
            label: 'Flows',
            path: '/flows',
            icon: <Workflow className="w-4 h-4" />,
            instructorOnly: false,
        },
        {
            label: 'LTI',
            path: '/lti',
            icon: <KeyRound className="w-4 h-4" />,
            instructorOnly: true,
        },
    ].filter((item) => !item.instructorOnly || isInstructor);

    const isItemActive = (path: string): boolean => {
        if (path === '/') {
            return location.pathname === '/';
        }

        if (path === '/flows') {
            return location.pathname === '/flows' || location.pathname.startsWith('/flows/');
        }

        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const getInitials = (name: string | null): string => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <nav className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-50">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Brain className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg tracking-tight">Mindflow</span>
            </Link>

            <div className="flex items-center gap-1">
                {navItems.map((item) => {
                    const isActive = isItemActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            <div className="w-[100px] flex items-center justify-end">
                {loading ? (
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                ) : authenticated ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                aria-label="User menu"
                            >
                                {getInitials(userName)}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium leading-none">{userName}</p>
                                    {userEmail && (
                                        <p className="text-xs text-muted-foreground leading-none">{userEmail}</p>
                                    )}
                                    {roles && (
                                        <p className="text-xs text-muted-foreground leading-none capitalize">{roles}</p>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                <User className="w-3.5 h-3.5 mr-2" />
                                Signed in via {provider === 'google' ? 'Google' : 'LTI'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => logout()}>
                                <LogOut className="w-3.5 h-3.5 mr-2" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <button
                        onClick={startGoogleLogin}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Sign in with Google to manage private LTI credentials"
                    >
                        <LogIn className="w-4 h-4" />
                        <span className="text-xs font-medium">Google Login</span>
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
