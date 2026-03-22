import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Home, Database, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
    const location = useLocation();

    const navItems = [
        {
            label: 'Home',
            path: '/',
            icon: <Home className="w-4 h-4" />,
        },
        {
            label: 'Documents',
            path: '/documents',
            icon: <FileText className="w-4 h-4" />,
        },
        {
            label: 'Flows',
            path: '/flows',
            icon: <Workflow className="w-4 h-4" />,
        },
    ];

    const isItemActive = (path: string): boolean => {
        if (path === '/') {
            return location.pathname === '/';
        }

        if (path === '/flows') {
            return location.pathname === '/flows' || location.pathname.startsWith('/flows/');
        }

        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <nav className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-50">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Database className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg tracking-tight">Agentic Flow</span>
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

            <div className="w-[100px]" /> {/* Spacer for balance */}
        </nav>
    );
};

export default Navbar;
