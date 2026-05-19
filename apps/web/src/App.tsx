import { Route, Routes } from "react-router-dom";
import { ReactNode } from "react";
import { Role } from "@snb/shared";
import { NavBar } from "./components/NavBar";
import { RequireRole } from "./components/RequireRole";
import { Toaster } from "./components/Toaster";
import { ScrollToTop } from "./components/ScrollToTop";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { MenuPage } from "./pages/Menu";
import { ShopPage } from "./pages/Shop";
import { CartPage } from "./pages/Cart";
import { OrdersPage } from "./pages/Orders";
import { OrderDetailPage } from "./pages/OrderDetail";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminMenu } from "./pages/admin/AdminMenu";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminPos } from "./pages/admin/AdminPos";

function Contained({ children }: { children: ReactNode }) {
  return <div className="max-w-6xl mx-auto p-4">{children}</div>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <ScrollToTop />
      <NavBar />
      <Toaster />
      <ScrollToTopButton />
      <main id="main-content" tabIndex={-1}>
      <Routes>
        {/* full-width landing */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* POS — operator workspace, also accessible to admins/superadmins */}
        <Route
          path="/pos"
          element={
            <RequireRole allow={[Role.PosOperator, Role.Admin, Role.SuperAdmin]}>
              <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-10 py-4 md:py-6">
                <AdminPos />
              </div>
            </RequireRole>
          }
        />

        {/* contained pages */}
        <Route path="/menu" element={<Contained><MenuPage /></Contained>} />
        <Route path="/shop" element={<Contained><ShopPage /></Contained>} />
        <Route path="/cart" element={<Contained><CartPage /></Contained>} />
        <Route
          path="/orders"
          element={
            <RequireRole allow={[Role.Customer, Role.Admin, Role.SuperAdmin]}>
              <Contained><OrdersPage /></Contained>
            </RequireRole>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireRole allow={[Role.Customer, Role.PosOperator, Role.Admin, Role.SuperAdmin]}>
              <Contained><OrderDetailPage /></Contained>
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole allow={[Role.Admin, Role.SuperAdmin]}>
              <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-10 py-4 md:py-6">
                <AdminLayout />
              </div>
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route
            path="menu"
            element={
              <RequireRole allow={[Role.Admin, Role.SuperAdmin]}>
                <AdminMenu />
              </RequireRole>
            }
          />
          <Route
            path="products"
            element={
              <RequireRole allow={[Role.Admin, Role.SuperAdmin]}>
                <AdminProducts />
              </RequireRole>
            }
          />
          <Route
            path="users"
            element={
              <RequireRole allow={[Role.SuperAdmin]}>
                <AdminUsers />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
      </main>
    </div>
  );
}
