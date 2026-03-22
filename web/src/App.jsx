import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminProductFormPage from "./pages/AdminProductFormPage";
import AdminProfilePage from "./pages/AdminProfilePage";
import AdminBarcodePage from "./pages/AdminBarcodePage";

function App() {
  return (
    <Routes>
      {/* Rutas publicas */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Rutas admin (protegidas) */}
      <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/products/new" element={<AdminProductFormPage />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductFormPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/admin/barcode" element={<AdminBarcodePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// Nota: la ruta /admin/barcode y AdminBarcodePage se añaden en el dia 18.

export default App;