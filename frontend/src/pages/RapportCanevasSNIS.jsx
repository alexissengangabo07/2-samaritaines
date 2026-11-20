import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/product.api";
import { getVentes } from "../api/vente.api";
import { getApprovisionnements } from "../api/approvisionnement.api";
import Layout from "../components/Layout";
import { Printer, Search, ClipboardList, Filter } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import Entete from "../assets/entete.png";

const MOIS_LISTE = [
  { value: "0", label: "Janvier" },
  { value: "1", label: "Février" },
  { value: "2", label: "Mars" },
  { value: "3", label: "Avril" },
  { value: "4", label: "Mai" },
  { value: "5", label: "Juin" },
  { value: "6", label: "Juillet" },
  { value: "7", label: "Août" },
  { value: "8", label: "Septembre" },
  { value: "9", label: "Octobre" },
  { value: "10", label: "Novembre" },
  { value: "11", label: "Décembre" },
];

export default function RapportCanevasSNIS() {
  const printRef = useRef();

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth().toString(),
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TOUTES");

  // Ajustements / saisies manuelles par produit_id
  const [manualAdjustments, setManualAdjustments] = useState({});

  const { data: productsData = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await getProducts();
      return Array.isArray(res.data)
        ? res.data
        : res.data?.products || res.data?.data || [];
    },
  });

  const { data: ventesData = [] } = useQuery({
    queryKey: ["ventes"],
    queryFn: async () => {
      const res = await getVentes();
      return Array.isArray(res.data)
        ? res.data
        : res.data?.ventes || res.data?.data || [];
    },
  });

  const { data: approvisionnementsData = [] } = useQuery({
    queryKey: ["approvisionnements"],
    queryFn: async () => {
      const res = await getApprovisionnements();
      return Array.isArray(res.data)
        ? res.data
        : res.data?.approvisionnements || res.data?.data || [];
    },
  });

  const availableYears = useMemo(() => {
    const years = new Set(["2025", "2026", "2027"]);
    ventesData.forEach((v) => {
      const d = new Date(v.dateVente || v.createdAt);
      if (!isNaN(d.getTime())) years.add(d.getFullYear().toString());
    });
    approvisionnementsData.forEach((a) => {
      const d = new Date(a.dateApprovisionnement || a.createdAt);
      if (!isNaN(d.getTime())) years.add(d.getFullYear().toString());
    });
    return Array.from(years).sort();
  }, [ventesData, approvisionnementsData]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Canevas_Mensuel_Medicaments_${parseInt(selectedMonth, 10) + 1}_${selectedYear}`,
  });

  const handleManualChange = (productId, field, value) => {
    const num = value === "" ? "" : Number(value);
    setManualAdjustments((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: num,
      },
    }));
  };

  // Quantité consommée par produit_id sur le mois et l'année sélectionnés (modèles Vente & DetailVente)[cite: 13, 17]
  const consumedByProduct = useMemo(() => {
    const map = {};
    const targetMonth = parseInt(selectedMonth, 10);
    const targetYear = parseInt(selectedYear, 10);

    ventesData.forEach((vente) => {
      const d = new Date(vente.dateVente || vente.createdAt);
      if (isNaN(d.getTime())) return;

      if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
        const lignes = vente.items || vente.DetailVentes || vente.details || [];
        lignes.forEach((item) => {
          const prodId =
            item.produit_id ||
            item.produitId ||
            item.produit?.id ||
            item.id_produit;
          if (!prodId) return;
          map[prodId] = (map[prodId] || 0) + Number(item.quantite || 0);
        });
      }
    });

    return map;
  }, [ventesData, selectedMonth, selectedYear]);

  // Entrées du mois par produit_id (modèle Approvisionnement : dateApprovisionnement & quantite)[cite: 11]
  const entriesByProduct = useMemo(() => {
    const map = {};
    const targetMonth = parseInt(selectedMonth, 10);
    const targetYear = parseInt(selectedYear, 10);

    approvisionnementsData.forEach((app) => {
      const d = new Date(app.dateApprovisionnement || app.createdAt);
      if (isNaN(d.getTime())) return;

      if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
        const prodId =
          app.produit_id || app.produitId || app.id_produit || app.produit?.id;
        if (!prodId) return;
        map[prodId] = (map[prodId] || 0) + Number(app.quantite || 0);
      }
    });

    return map;
  }, [approvisionnementsData, selectedMonth, selectedYear]);

  // Construction des lignes du canevas alignées sur les modèles
  const rows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return productsData
      .filter((p) => {
        const catName = p.Category?.nom || p.categorie?.nom || "AUTRES";
        const matchesCat =
          selectedCategory === "TOUTES" || catName === selectedCategory;
        const matchesSearch =
          !q ||
          (p.nom || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q);
        return matchesCat && matchesSearch;
      })
      .map((product, index) => {
        const consumed = consumedByProduct[product.id] || 0;
        const autoEntry = entriesByProduct[product.id] || 0;
        const currentStock = Number(product.quantite || 0);
        const adj = manualAdjustments[product.id] || {};

        const entreeMois =
          adj.entreeMois !== undefined && adj.entreeMois !== ""
            ? Number(adj.entreeMois)
            : autoEntry;

        const perte =
          adj.perte !== undefined && adj.perte !== "" ? Number(adj.perte) : 0;

        const ajustement =
          adj.ajustement !== undefined && adj.ajustement !== ""
            ? Number(adj.ajustement)
            : 0;

        const stockDisponibleUtilisable =
          adj.stockDispo !== undefined && adj.stockDispo !== ""
            ? Number(adj.stockDispo)
            : currentStock;

        const stockDebutMois =
          adj.stockDebut !== undefined && adj.stockDebut !== ""
            ? Number(adj.stockDebut)
            : Math.max(
                0,
                stockDisponibleUtilisable +
                  consumed +
                  perte -
                  entreeMois -
                  ajustement,
              );

        const joursRupture =
          adj.joursRupture !== undefined && adj.joursRupture !== ""
            ? Number(adj.joursRupture)
            : stockDisponibleUtilisable <= 0
              ? 1
              : 0;

        const uniteLabel =
          product.UniteQte?.label ||
          product.unite?.label ||
          product.unite ||
          "1 Unité";

        const categorieLabel = (
          product.Category?.nom ||
          product.categorie?.nom ||
          "MÉDICAMENTS GÉNÉRAUX"
        ).toUpperCase();

        const descriptionComplete = product.description
          ? `${product.nom} — ${product.description}`
          : product.nom;

        return {
          numero: index + 1,
          id: product.id,
          categorie: categorieLabel,
          description: descriptionComplete,
          unite: uniteLabel,
          stockDebutMois,
          entreeMois,
          quantiteConsommee: consumed,
          perte,
          ajustement,
          stockDisponibleUtilisable,
          joursRupture,
        };
      });
  }, [
    productsData,
    consumedByProduct,
    entriesByProduct,
    manualAdjustments,
    searchTerm,
    selectedCategory,
  ]);

  const categories = useMemo(() => {
    const set = new Set(["TOUTES"]);
    productsData.forEach((p) => {
      const cat = p.Category?.nom || p.categorie?.nom;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [productsData]);

  const groupedRows = useMemo(() => {
    const groups = {};
    rows.forEach((row) => {
      if (!groups[row.categorie]) {
        groups[row.categorie] = [];
      }
      groups[row.categorie].push(row);
    });
    return Object.entries(groups);
  }, [rows]);

  const moisLabel =
    MOIS_LISTE.find((m) => m.value === selectedMonth)?.label || "";

  const renderTableContent = (editable = true) => (
    <table className="w-full text-left border-collapse border border-slate-400 text-xs">
      <thead>
        <tr className="bg-[#a8c6d8] text-slate-950 font-bold text-[11px]">
          <th className="p-2 border border-slate-400 w-12 text-center">N°</th>
          <th className="p-2 border border-slate-400">
            Description du produit (Nomen DCI, Forme et Dosage)
          </th>
          <th className="p-2 border border-slate-400 w-24 text-center">
            Unités
          </th>
          <th className="p-2 border border-slate-400 w-24 text-center">
            Stock début du Mois
          </th>
          <th className="p-2 border border-slate-400 w-24 text-center">
            Entrée du Mois
          </th>
          <th className="p-2 border border-slate-400 w-24 text-center">
            Quantité Consommée
          </th>
          <th className="p-2 border border-slate-400 w-20 text-center">
            Perte
          </th>
          <th className="p-2 border border-slate-400 w-24 text-center">
            Ajustement (+/-)
          </th>
          <th className="p-2 border border-slate-400 w-24 text-center">
            Stock disponible utilisable
          </th>
          <th className="p-2 border border-slate-400 w-24 text-center">
            Nbre de Jours de rupture de stock
          </th>
        </tr>
      </thead>
      <tbody>
        {groupedRows.length === 0 ? (
          <tr>
            <td
              colSpan="10"
              className="p-6 text-center text-slate-500 italic border border-slate-400"
            >
              Aucun médicament trouvé pour ces critères.
            </td>
          </tr>
        ) : (
          groupedRows.map(([categoryName, items]) => (
            <>
              <tr key={`cat-${categoryName}`} className="bg-[#dce9f2]">
                <td
                  colSpan="10"
                  className="px-3 py-1.5 font-extrabold text-[11px] uppercase tracking-wider text-slate-900 border border-slate-400"
                >
                  {categoryName}
                </td>
              </tr>
              {items.map((item) => {
                const adj = manualAdjustments[item.id] || {};
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-2 border border-slate-400 text-center font-semibold">
                      {item.numero}
                    </td>
                    <td className="p-2 border border-slate-400 font-medium text-slate-900 capitalize">
                      {item.description}
                    </td>
                    <td className="p-2 border border-slate-400 text-center text-slate-700">
                      {item.unite}
                    </td>

                    {/* Stock début du Mois */}
                    <td className="p-1.5 border border-slate-400 text-center">
                      {editable ? (
                        <input
                          type="number"
                          value={
                            adj.stockDebut !== undefined
                              ? adj.stockDebut
                              : item.stockDebutMois
                          }
                          onChange={(e) =>
                            handleManualChange(
                              item.id,
                              "stockDebut",
                              e.target.value,
                            )
                          }
                          className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs"
                        />
                      ) : (
                        item.stockDebutMois
                      )}
                    </td>

                    {/* Entrée du Mois */}
                    <td className="p-1.5 border border-slate-400 text-center">
                      {editable ? (
                        <input
                          type="number"
                          value={
                            adj.entreeMois !== undefined
                              ? adj.entreeMois
                              : item.entreeMois
                          }
                          onChange={(e) =>
                            handleManualChange(
                              item.id,
                              "entreeMois",
                              e.target.value,
                            )
                          }
                          className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs font-semibold text-blue-700"
                        />
                      ) : (
                        item.entreeMois
                      )}
                    </td>

                    {/* Quantité Consommée */}
                    <td className="p-2 border border-slate-400 text-center font-bold text-teal-700">
                      {item.quantiteConsommee}
                    </td>

                    {/* Perte */}
                    <td className="p-1.5 border border-slate-400 text-center">
                      {editable ? (
                        <input
                          type="number"
                          min="0"
                          value={
                            adj.perte !== undefined ? adj.perte : item.perte
                          }
                          onChange={(e) =>
                            handleManualChange(item.id, "perte", e.target.value)
                          }
                          className="w-14 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs"
                        />
                      ) : (
                        item.perte
                      )}
                    </td>

                    {/* Ajustement (+/-) */}
                    <td className="p-1.5 border border-slate-400 text-center">
                      {editable ? (
                        <input
                          type="number"
                          value={
                            adj.ajustement !== undefined
                              ? adj.ajustement
                              : item.ajustement
                          }
                          onChange={(e) =>
                            handleManualChange(
                              item.id,
                              "ajustement",
                              e.target.value,
                            )
                          }
                          className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs"
                        />
                      ) : (
                        item.ajustement
                      )}
                    </td>

                    {/* Stock disponible utilisable */}
                    <td className="p-1.5 border border-slate-400 text-center font-bold">
                      {editable ? (
                        <input
                          type="number"
                          min="0"
                          value={
                            adj.stockDispo !== undefined
                              ? adj.stockDispo
                              : item.stockDisponibleUtilisable
                          }
                          onChange={(e) =>
                            handleManualChange(
                              item.id,
                              "stockDispo",
                              e.target.value,
                            )
                          }
                          className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs font-bold"
                        />
                      ) : (
                        item.stockDisponibleUtilisable
                      )}
                    </td>

                    {/* Nbre de Jours de rupture de stock */}
                    <td className="p-1.5 border border-slate-400 text-center">
                      {editable ? (
                        <input
                          type="number"
                          min="0"
                          value={
                            adj.joursRupture !== undefined
                              ? adj.joursRupture
                              : item.joursRupture
                          }
                          onChange={(e) =>
                            handleManualChange(
                              item.id,
                              "joursRupture",
                              e.target.value,
                            )
                          }
                          className="w-14 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs"
                        />
                      ) : (
                        item.joursRupture
                      )}
                    </td>
                  </tr>
                );
              })}
            </>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-teal-600" />
            Canevas Mensuel des Médicaments
          </h1>
          <p className="text-sm text-slate-500">
            Suivi des stocks, entrées, consommations, pertes et ruptures par
            période mensuelle
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Imprimer le Canevas ({moisLabel}{" "}
          {selectedYear})
        </button>
      </div>

      {/* Barre de filtres : Mois, Année, Catégorie, Recherche */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Filter className="w-4 h-4 text-teal-600" /> Période :
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
          >
            {MOIS_LISTE.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer capitalize"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "TOUTES" ? "Toutes les catégories" : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un médicament..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Tableau interactif du canevas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-700">
            Canevas Mensuel — {moisLabel} {selectedYear}
          </span>
          <span className="text-[11px] text-slate-400">
            Les entrées du mois sont calculées à partir des approvisionnements
            et restent ajustables avant impression.
          </span>
        </div>
        {renderTableContent(true)}
      </div>

      {/* Version d'impression cachée */}
      <div className="hidden">
        <div ref={printRef} className="p-6 bg-white text-slate-950 font-sans">
          <img src={Entete} alt="entete" className="mx-auto max-h-14 mb-3" />
          <div className="flex items-center justify-between mb-3 border-b border-slate-300 pb-2">
            <h2 className="text-base font-extrabold text-slate-900">
              Canevas Mensuel de Gestion des Médicaments
            </h2>
            <span className="text-xs font-bold text-slate-700">
              Mois : {moisLabel} {selectedYear}
            </span>
          </div>
          {renderTableContent(false)}
          <div className="grid grid-cols-2 gap-8 text-xs mt-10 pt-6">
            <div className="text-center">
              <p className="font-bold mb-10">Le Responsable de la Pharmacie</p>
              <div className="border-b border-slate-400 w-48 mx-auto" />
            </div>
            <div className="text-center">
              <p className="font-bold mb-10">Visa de la Direction</p>
              <div className="border-b border-slate-400 w-48 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
