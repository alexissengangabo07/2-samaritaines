import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/product.api';
import { getVentes } from '../api/vente.api';
import Layout from '../components/Layout';
import { Pill, ShoppingCart, AlertTriangle, TrendingUp, CalendarCheck } from 'lucide-react';

export default function Dashboard() {
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: async () => (await getProducts()).data });
  const { data: ventes = [] } = useQuery({ queryKey: ['ventes'], queryFn: async () => (await getVentes()).data });

  // Calculs d'indicateurs
  const totalStock = products.reduce((acc, p) => acc + p.quantite, 0);
  const lowStockProducts = products.filter(p => p.quantite <= 5);
  const totalVentesCount = ventes.length;

  // Filtrage et comptage des ventes d'aujourd'hui
  const ventesAujourdhui = useMemo(() => {
    const today = new Date();
    return ventes.filter(vente => {
      const venteDate = new Date(vente.dateVente || vente.createdAt);
      return (
        venteDate.getDate() === today.getDate() &&
        venteDate.getMonth() === today.getMonth() &&
        venteDate.getFullYear() === today.getFullYear()
      );
    });
  }, [ventes]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tableau de Bord</h1>
        <p className="text-sm text-slate-500">Aperçu global de l'activité et des stocks de la pharmacie</p>
      </div>

      {/* Cartes d'indicateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Médicaments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Médicaments</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{products.length}</p>
            <span className="text-xs text-slate-500 mt-1 inline-block">{totalStock} unités en stock</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        {/* Ventes d'Aujourd'hui */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ventes Aujourd'hui</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{ventesAujourdhui.length}</p>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Aujourd'hui
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Ventes Enregistrées */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ventes Globales</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalVentesCount}</p>
            <span className="text-xs text-slate-500 font-semibold mt-1 inline-flex items-center gap-1">
              Historique total
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Stock Faible */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Faible</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{lowStockProducts.length}</p>
            <span className="text-xs text-amber-700 font-medium mt-1 inline-block">Réapprovisionnement requis</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tableau des alertes de stock faible */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Médicaments proches de la rupture
        </h2>
        {lowStockProducts.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun produit en rupture critique actuellement.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {lowStockProducts.map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800 capitalize">{item.nom}</span>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs">
                  Reste : {item.quantite}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}