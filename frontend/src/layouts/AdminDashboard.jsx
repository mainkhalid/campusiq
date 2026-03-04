import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Admin/Header";
import Sidebar from "../components/Admin/Sidebar";

export default function AdminDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
                
                <div className="flex-1 flex flex-col min-h-screen">
                    <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                    
                    <main className="flex-1 p-2 lg:p-8">
                        <div className="w-full mx-auto">
                            <Outlet />
                        </div>
                    </main>

                    
                    <footer className="bg-[#3b4d6e] border-t border-slate-200 py-4 px-6">
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-white">
                            <p>© 2026 Zetech University. All rights reserved.</p>
                            <div className="flex gap-4">
                                <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a>
                                <a href="#" className="hover:text-orange-500 transition-colors">Support</a>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}