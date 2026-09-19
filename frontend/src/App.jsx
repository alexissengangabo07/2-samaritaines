import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Ventes from './pages/Ventes';
import Approvisionnements from './pages/Approvisionnements';
import Fournisseurs from './pages/Fournisseurs';
import Categories from './pages/Categories';
import Unites from './pages/Unites';
import PrivateRoute from './components/PrivateRoute';
import Inventaires from './pages/Inventaires';
import RapportVentes from './pages/RapportVentes';
import Sorties from './pages/Sorties';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Routes ouvertes à tous les utilisateurs connectés */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ventes" element={<Ventes />} />
      </Route>

      {/* Routes réservées aux Pharmaciens et Admins */}
      <Route element={<PrivateRoute allowedRoles={['admin', 'pharmacien']} />}>
        <Route path="/products" element={<Products />} />
        <Route path="/approvisionnements" element={<Approvisionnements />} />
        <Route path="/inventaires" element={<Inventaires />} />
        <Route path="/fournisseurs" element={<Fournisseurs />} />
        <Route path="/sorties" element={<Sorties />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/unites" element={<Unites />} />
        <Route path="/rapports-ventes" element={<RapportVentes />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;