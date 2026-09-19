import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar />

      {/* Main application area */}
      <div className="ml-64 min-h-screen">

        {/* Top navigation */}
        <Topbar />

        {/* Page content */}
        <main className="pt-20">

          <div className="min-h-[calc(100vh-5rem)] px-6 py-6 lg:px-8">

            <Outlet />

          </div>

        </main>

      </div>

    </div>
  );
}

export default MainLayout;