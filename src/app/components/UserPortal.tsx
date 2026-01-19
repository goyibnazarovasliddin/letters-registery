import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserHeader } from './UserHeader';
import { UserSidebar } from './UserSidebar';

export function UserPortal() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <UserHeader />
            <div className="flex flex-1">
                <UserSidebar />
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
