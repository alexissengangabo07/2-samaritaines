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
import Users from './pages/Users';
import Abonnes from './pages/Abonnes';
import Entreprises from './pages/Entreprises';
import CreditVentes from './pages/CreditVentes'; 
import Expired from './pages/Expired';

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/expired" element={<Expired />} />

        {/* Routes ouvertes à tous les utilisateurs connectés */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ventes" element={<Ventes />} />
          <Route path="/ventes-credit" element={<CreditVentes />} /> {/* AJOUT */}
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
          <Route path="/utilisateurs" element={<Users />} />
          <Route path="/abonnes" element={<Abonnes />} /> {/* AJOUT */}
          <Route path="/entreprises" element={<Entreprises />} /> {/* AJOUT */}
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <a href="https://wa.me/+243966790824"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-3 right-4 text-[10px] text-white/90 hover:text-teal-300 transition-colors z-50 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm"
      >
        © {new Date().getFullYear()} KivuNex
      </a>
    </>
  );
}

export default App;