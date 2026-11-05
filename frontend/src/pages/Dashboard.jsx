import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/product.api";
import { getVentes } from "../api/vente.api";
import Layout from "../components/Layout";
import {
  Pill,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  CalendarCheck,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await getProducts();
      return Array.isArray(res.data) ? res.data : res.data?.products || [];
    },
  });

  const { data: ventes = [] } = useQuery({
    queryKey: ["ventes"],
    queryFn: async () => {
      const res = await getVentes();
      return Array.isArray(res.data)
        ? res.data
        : res.data?.ventes || res.data?.data || [];
    },
  });

  // États pour filtrer le graphique ('journalier', 'hebdomadaire', 'mensuel', 'annuel', 'tout')
  const [chartPeriod, setChartPeriod] = useState("annuel"); // Par défaut 'annuel' pour capturer 2026
  const [selectedMonth, setSelectedMonth] = useState("10"); // Octobre par défaut
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  ); // Année courante (2026)

  // Calculs d'indicateurs globaux
  const totalStock = products.reduce(
    (acc, p) => acc + Number(p.quantite || 0),
    0,
  );
  const lowStockProducts = products.filter(
    (p) => Number(p.quantite || 0) <= Number(p.stock_alerte || 5),
  );
  const totalVentesCount = ventes.length;

  // Filtrage et comptage des ventes d'aujourd'hui
  const ventesAujourdhui = useMemo(() => {
    const today = new Date();
    return ventes.filter((vente) => {
      const dateRef = vente.dateVente || vente.createdAt;
      if (!dateRef) return false;
      const venteDate = new Date(dateRef);
      return (
        venteDate.getDate() === today.getDate() &&
        venteDate.getMonth() === today.getMonth() &&
        venteDate.getFullYear() === today.getFullYear()
      );
    });
  }, [ventes]);

  // Traitement sécurisé des données pour le graphique des ventes par médicament
  const chartData = useMemo(() => {
    const now = new Date();
    const mapQuantites = {};

    ventes.forEach((vente) => {
      const dateRef = vente.dateVente || vente.createdAt;
      if (!dateRef) return;
      const venteDate = new Date(dateRef);
      if (isNaN(venteDate.getTime())) return;

      let matchPeriod = false;

      if (chartPeriod === "journalier") {
        matchPeriod =
          venteDate.getDate() === now.getDate() &&
          venteDate.getMonth() === now.getMonth() &&
          venteDate.getFullYear() === now.getFullYear();
      } else if (chartPeriod === "hebdomadaire") {
        const currentDay = now.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + distanceToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        matchPeriod = venteDate >= startOfWeek && venteDate <= endOfWeek;
      } else if (chartPeriod === "mensuel") {
        matchPeriod =
          venteDate.getMonth() === parseInt(selectedMonth, 10) &&
          venteDate.getFullYear() === parseInt(selectedYear, 10);
      } else if (chartPeriod === "annuel") {
        // Filtrage strict par année sélectionnée
        matchPeriod = venteDate.getFullYear() === parseInt(selectedYear, 10);
      } else if (chartPeriod === "tout") {
        matchPeriod = true;
      }

      // Si la vente correspond à la période, on extrait ses lignes (items)
      if (matchPeriod && vente.items && Array.isArray(vente.items)) {
        vente.items.forEach((item) => {
          const nomProduit =
            item.produit?.nom ||
            item.nom_produit ||
            `Article #${item.produit_id || "N/A"}`;
          const qte = Number(item.quantite || 0);

          if (!mapQuantites[nomProduit]) {
            mapQuantites[nomProduit] = { name: nomProduit, quantite: 0 };
          }
          mapQuantites[nomProduit].quantite += qte;
        });
      }
    });

    // Tri par quantité décroissante et sélection du top 8 pour une lisibilité optimale
    return Object.values(mapQuantites)
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 8);
  }, [ventes, chartPeriod, selectedMonth, selectedYear]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Tableau de Bord
        </h1>
        <p className="text-sm text-slate-500">
          Aperçu global de l'activité et des stocks de la pharmacie
        </p>
      </div>

      {/* Cartes d'indicateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Médicaments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Médicaments
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {products.length}
            </p>
            <span className="text-xs text-slate-500 mt-1 inline-block">
              {totalStock} unités en stock
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        {/* Ventes d'Aujourd'hui */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ventes Aujourd'hui
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              {ventesAujourdhui.length}
            </p>
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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ventes Globales
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {totalVentesCount}
            </p>
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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Stock Faible
            </p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">
              {lowStockProducts.length}
            </p>
            <span className="text-xs text-amber-700 font-medium mt-1 inline-block">
              Réapprovisionnement requis
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION GRAPHIQUE : Ventes par Médicament */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Volume des ventes par médicament
            </h2>
            <p className="text-xs text-slate-500">
              Quantités délivrées par article selon la période sélectionnée
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sélecteur de mois si le filtre mensuel est actif */}
            {chartPeriod === "mensuel" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="0">Janvier</option>
                <option value="1">Février</option>
                <option value="2">Mars</option>
                <option value="3">Avril</option>
                <option value="4">Mai</option>
                <option value="5">Juin</option>
                <option value="6">Juillet</option>
                <option value="7">Août</option>
                <option value="8">Septembre</option>
                <option value="9">Octobre</option>
                <option value="10">Novembre</option>
                <option value="11">Décembre</option>
              </select>
            )}

            {/* Sélecteur d'année si le filtre mensuel ou annuel est actif */}
            {(chartPeriod === "mensuel" || chartPeriod === "annuel") && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            )}

            {/* Onglets de sélection de période pour le graphique */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: "journalier", label: "Aujourd'hui" },
                { id: "hebdomadaire", label: "Cette semaine" },
                { id: "mensuel", label: "Mensuel" },
                { id: "annuel", label: "Annuel" },
                { id: "tout", label: "Tout" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setChartPeriod(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    chartPeriod === tab.id
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Affichage du Graphique ou message si vide */}
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl p-4 text-center">
            <p>
              Aucune donnée de vente disponible pour la période sélectionnée.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              (Vos ventes en base de données se trouvent en 2026. Sélectionnez
              l'année 2026 ou l'onglet "Annuel").
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="quantite"
                  name="Quantité vendue"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tableau des alertes de stock faible */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Médicaments proches de la rupture
        </h2>
        {lowStockProducts.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucun produit en rupture critique actuellement.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {lowStockProducts.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between text-sm"
              >
                <span className="font-semibold text-slate-800 capitalize">
                  {item.nom}
                </span>
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
