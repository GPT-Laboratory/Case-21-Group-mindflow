import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
    const location = useLocation();

    const navItems = [
        {
            label: 'Flow Designer',
            path: '/',
            icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
            label: 'Document Manager',
            path: '/documents',
            icon: <FileText className="w-4 h-4" />,
        },
    ];

    return (
        <nav className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-50">
            <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg tracking-tight">Agentic Flow</span>
            </div>

            <div className="flex items-center gap-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
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
