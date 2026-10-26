import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVentes } from "../api/vente.api";
import { getProducts } from "../api/product.api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  BarChart3,
  Check,
  ChevronDown,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Receipt } from "../components/Receipt";
import Entete from "../assets/entete.png";

export default function RapportVentes() {
  const { user } = useAuth();
  const [lastSale, setLastSale] = useState(null);
  const receiptRef = useRef();
  const reportRef = useRef();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("journalier");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // États pour la recherche spécifique d'un médicament et ses statistiques
  const [selectedMedId, setSelectedMedId] = useState("");
  const [medSearch, setMedSearch] = useState("");
  const [isMedDropdownOpen, setIsMedDropdownOpen] = useState(false);
  const medDropdownRef = useRef(null);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Chargement des ventes
  const { data: ventesData = [] } = useQuery({
    queryKey: ["ventes"],
    queryFn: async () => {
      const res = await getVentes();
      return Array.isArray(res.data) ? res.data : res.data?.ventes || [];
    },
  });

  // Chargement des produits pour le select de statistiques (incluant le modèle d'unité)
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await getProducts()).data,
  });

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Facture_Vente_${lastSale?.id || Date.now()}`,
  });

  const handlePrintReport = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Rapport_Ventes_${activeTab}_${new Date().toISOString().split("T")[0]}`,
  });

  // Re-réimpression d'un reçu
  const handleReprint = (vente) => {
    const saleDetails = {
      id: vente.id,
      user_name: vente.vendeur?.name || "Vendeur",
      nom_client: vente.nom_client || "Client ordinaire",
      date: vente.dateVente || vente.createdAt,
      items: (vente.items || []).map((item) => ({
        nom: item.produit?.nom || "Produit",
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
      })),
      total: vente.total,
    };

    setLastSale(saleDetails);
    setTimeout(() => handlePrint(), 200);
  };

  // Fonction de filtrage par période commune
  const filterVentesByPeriod = (ventes, period) => {
    const now = new Date();
    return ventes.filter((vente) => {
      if (period === "tout") return true;

      const venteDate = new Date(vente.dateVente);
      if (isNaN(venteDate.getTime())) return false;

      if (period === "journalier") {
        return (
          venteDate.getDate() === now.getDate() &&
          venteDate.getMonth() === now.getMonth() &&
          venteDate.getFullYear() === now.getFullYear()
        );
      }

      if (period === "hebdomadaire") {
        const currentDay = now.getDay();
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + distanceToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return venteDate >= startOfWeek && venteDate <= endOfWeek;
      }

      if (period === "mensuel") {
        return (
          venteDate.getMonth() === now.getMonth() &&
          venteDate.getFullYear() === now.getFullYear()
        );
      }

      if (period === "annuel") {
        return venteDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  };

  // Filtrage des ventes pour le tableau principal
  const filteredVentes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const periodFiltered = filterVentesByPeriod(ventesData, activeTab);

    return periodFiltered.filter((vente) => {
      const clientName = (vente.nom_client || "").toLowerCase();
      const vendedorName = (vente.vendeur?.name || "").toLowerCase();
      const hasMatchingProduct = (vente.items || []).some((item) =>
        (item.produit?.nom || "").toLowerCase().includes(query),
      );

      return (
        clientName.includes(query) ||
        vendedorName.includes(query) ||
        hasMatchingProduct
      );
    });
  }, [ventesData, activeTab, searchTerm]);

  // Extraction à plat de toutes les lignes d'articles pour la table détaillée
  const flatRows = useMemo(() => {
    const rows = [];
    filteredVentes.forEach((vente) => {
      if (vente.items && vente.items.length > 0) {
        vente.items.forEach((item) => {
          const prixAchatU = item.produit?.prix_achat || 0;
          const prixVenteT =
            item.total_ligne || item.quantite * item.prix_unitaire;
          const beneficeT = prixVenteT - prixAchatU * item.quantite;

          // Récupération dynamique du libellé de l'unité
          const uniteLabel =
            item.produit?.UniteQte?.label ||
            item.produit?.unite?.label ||
            item.produit?.unite ||
            "unité(s)";

          rows.push({
            venteId: vente.id,
            produit_id: item.produit?.id || item.id_produit,
            nom_produit: item.produit?.nom || "N/A",
            quantite: item.quantite,
            unite_label: uniteLabel,
            nom_client: vente.nom_client || "Client ordinaire",
            prix_achat_u: prixAchatU,
            prix_vente_t: prixVenteT,
            benefice_t: beneficeT,
            vendeur_nom: vente.vendeur?.name || "N/A",
            dateVente: vente.dateVente,
            rawVente: vente,
          });
        });
      }
    });
    return rows;
  }, [filteredVentes]);

  // Calculs totaux du tableau
  const totals = useMemo(() => {
    return flatRows.reduce(
      (acc, row) => {
        acc.totalVente += row.prix_vente_t;
        acc.totalBenefice += row.benefice_t;
        return acc;
      },
      { totalVente: 0, totalBenefice: 0 },
    );
  }, [flatRows]);

  // Statistiques spécifiques pour le médicament sélectionné avec extraction de son modèle d'unité
  const medStats = useMemo(() => {
    if (!selectedMedId) return null;

    const periodFiltered = filterVentesByPeriod(ventesData, activeTab);
    let totalQty = 0;
    let totalRevenue = 0;
    let totalBenefice = 0;
    let unitLabel = "";

    periodFiltered.forEach((vente) => {
      if (vente.items && vente.items.length > 0) {
        vente.items.forEach((item) => {
          const prodId = item.produit?.id || item.id_produit;
          if (prodId === parseInt(selectedMedId, 10)) {
            const qte = item.quantite || 0;
            const prixAchatU = item.produit?.prix_achat || 0;
            const prixVenteT = item.total_ligne || qte * item.prix_unitaire;
            const beneficeT = prixVenteT - prixAchatU * qte;

            totalQty += qte;
            totalRevenue += prixVenteT;
            totalBenefice += beneficeT;

            if (!unitLabel) {
              unitLabel =
                item.produit?.UniteQte?.label ||
                item.produit?.unite?.label ||
                item.produit?.unite ||
                "";
            }
          }
        });
      }
    });

    const targetProduct = products.find(
      (p) => p.id === parseInt(selectedMedId, 10),
    );

    // Si l'unité n'a pas été trouvée dans les ventes, on la cherche dans le produit sélectionné
    if (!unitLabel && targetProduct) {
      unitLabel =
        targetProduct.UniteQte?.label ||
        targetProduct.unite?.label ||
        targetProduct.unite ||
        "unité(s)";
    }

    return {
      productName: targetProduct?.nom || "Médicament sélectionné",
      totalQty,
      unitLabel: unitLabel || "unité(s)",
      totalRevenue,
      totalBenefice,
    };
  }, [selectedMedId, ventesData, activeTab, products]);

  const filteredProductsForSelect = products.filter((p) =>
    p.nom?.toLowerCase().includes(medSearch.toLowerCase()),
  );

  const selectedProductObj = products.find(
    (p) => p.id === parseInt(selectedMedId, 10),
  );

  const totalPages = Math.ceil(flatRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRows = flatRows.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Layout>
      <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Rapports & Statistiques des Ventes
          </h1>
          <p className="text-sm text-slate-500">
            Historique détaillé et analyses par article
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          disabled={flatRows.length === 0}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-40"
        >
          <Printer className="w-4 h-4" /> Imprimer Rapport ({activeTab})
        </button>
      </div>

      {/* SECTION STATISTIQUES PAR MÉDICAMENT SPÉCIFIQUE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" /> Analyse ciblée par
              Médicament
            </h2>
            <p className="text-xs text-slate-500">
              Sélectionnez un médicament pour connaître les quantités vendues et
              les bénéfices sur la période active ({activeTab})
            </p>
          </div>

          <div className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl">
            Période active : <span className="capitalize">{activeTab}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Select avec recherche pour le médicament */}
          <div className="relative" ref={medDropdownRef}>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Choisir un médicament
            </label>
            <button
              type="button"
              onClick={() => setIsMedDropdownOpen(!isMedDropdownOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
            >
              <span
                className={
                  selectedProductObj
                    ? "text-slate-900 font-semibold capitalize"
                    : "text-slate-400"
                }
              >
                {selectedProductObj
                  ? `${selectedProductObj.nom} (${selectedProductObj.UniteQte?.label || selectedProductObj.unite?.label || "unité"})`
                  : "-- Sélectionnez un médicament --"}
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                {selectedMedId && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedId("");
                      setMedSearch("");
                    }}
                    className="hover:text-rose-600 mr-1 font-bold"
                  >
                    ×
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isMedDropdownOpen && (
              <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrer les médicaments..."
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                  {filteredProductsForSelect.length === 0 ? (
                    <div className="py-3 text-center text-xs text-slate-400">
                      Aucun médicament trouvé
                    </div>
                  ) : (
                    filteredProductsForSelect.map((p) => {
                      const isSelected = parseInt(selectedMedId, 10) === p.id;
                      const uLabel =
                        p.UniteQte?.label || p.unite?.label || p.unite || "";
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedMedId(p.id.toString());
                            setIsMedDropdownOpen(false);
                            setMedSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-teal-50 text-teal-700 font-semibold"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span className="capitalize">
                            {p.nom}{" "}
                            {uLabel && (
                              <span className="text-slate-400 font-normal">
                                ({uLabel})
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-teal-600" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Affichage des Résultats Statistiques avec l'Unité réelle */}
          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-around gap-4">
            {medStats ? (
              <>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quantité Vendue
                  </p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {medStats.totalQty}{" "}
                    <span className="text-xs font-semibold text-teal-600 capitalize">
                      {medStats.unitLabel}
                    </span>
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Chiffre d'affaires
                  </p>
                  <p className="text-xl font-black text-teal-600 mt-0.5">
                    {medStats.totalRevenue.toLocaleString()} FC
                  </p>
                </div>
                {isAdmin && (
                  <>
                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Bénéfice Réalisé
                      </p>
                      <p
                        className={`text-xl font-black mt-0.5 ${medStats.totalBenefice >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {medStats.totalBenefice.toLocaleString()} FC
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Veuillez sélectionner un médicament ci-contre pour afficher ses
                statistiques.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* TABLEAU PRINCIPAL DES VENTES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 capitalize">
              <FileText className="w-5 h-5 text-teal-600" />
              Détails des Ventes
            </h2>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher produit, client..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {[
                  "journalier",
                  "hebdomadaire",
                  "mensuel",
                  "annuel",
                  "tout",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Produit</th>
                  <th className="py-3 px-6">Qté</th>
                  <th className="py-3 px-6">Client</th>
                  {isAdmin && (
                    <>
                      <th className="py-3 px-6">P. Achat U</th>
                      <th className="py-3 px-6">P. Vente T</th>
                      <th className="py-3 px-6">Bénéfice T</th>
                    </>
                  )}
                  <th className="py-3 px-6">Vendu par</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? "9" : "6"}
                      className="py-8 text-center text-slate-400 text-sm"
                    >
                      Aucun article vendu enregistré pour cette sélection.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((row, idx) => {
                    const dateObj = new Date(row.dateVente);

                    return (
                      <tr
                        key={`${row.venteId}-${idx}`}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="py-3.5 px-6 font-semibold text-slate-900 capitalize">
                          {row.nom_produit}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 font-bold">
                          {row.quantite}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            {row.unite_label}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-700 capitalize font-medium">
                          {row.nom_client}
                        </td>
                        {isAdmin && (
                          <>
                            <td className="py-3.5 px-6 text-slate-500 font-medium">
                              {row.prix_achat_u.toLocaleString()} FC
                            </td>
                            <td className="py-3.5 px-6 text-slate-700 font-medium">
                              {row.prix_vente_t.toLocaleString()} FC
                            </td>
                            <td
                              className={`py-3.5 px-6 font-bold ${
                                row.benefice_t > 0
                                  ? "text-emerald-600"
                                  : row.benefice_t < 0
                                    ? "text-rose-600"
                                    : "text-slate-400"
                              }`}
                            >
                              {row.benefice_t.toLocaleString()} FC
                            </td>
                          </>
                        )}
                        <td className="py-3.5 px-6 text-slate-600 capitalize">
                          {row.vendeur_nom}
                        </td>
                        <td className="py-3.5 px-6 text-slate-400 text-xs">
                          {!isNaN(dateObj.getTime())
                            ? `${dateObj.toLocaleDateString("fr-FR")} ${dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleReprint(row.rawVente)}
                            className="text-slate-400 hover:text-teal-600 transition-colors p-1 cursor-pointer"
                            title="Reimprimer le reçu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {flatRows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-sm font-bold text-slate-900">
                    <td
                      colSpan={isAdmin ? "4" : "3"}
                      className="py-3.5 px-6 uppercase text-xs tracking-wider text-slate-600"
                    >
                      Total Période ({flatRows.length} lignes)
                    </td>
                    {isAdmin ? (
                      <>
                        <td className="py-3.5 px-6 text-slate-700">
                          {totals.totalVente.toLocaleString()} FC
                        </td>
                        <td
                          className={`py-3.5 px-6 font-bold text-lg ${
                            totals.totalBenefice > 0
                              ? "text-emerald-600"
                              : totals.totalBenefice < 0
                                ? "text-rose-600"
                                : "text-slate-400"
                          }`}
                        >
                          {totals.totalBenefice.toLocaleString()} FC
                        </td>
                        <td colSpan="3"></td>
                      </>
                    ) : (
                      <td colSpan="3"></td>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Pagination */}
        {flatRows.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Affichage de{" "}
              <span className="font-semibold">{startIndex + 1}</span> à{" "}
              <span className="font-semibold">
                {Math.min(startIndex + itemsPerPage, flatRows.length)}
              </span>{" "}
              sur <span className="font-semibold">{flatRows.length}</span>{" "}
              résultats
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 px-2">
                Page {currentPage} sur {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Impression masquée */}
      <div className="hidden">
        <Receipt ref={receiptRef} saleData={lastSale} />

        <div ref={reportRef} className="p-8 bg-white text-slate-900 font-sans">
          <img src={Entete} alt="entete" />
          <h2 className="text-xl font-bold mb-2">
            Rapport des Ventes - {activeTab.toUpperCase()}
          </h2>

          <table className="w-full text-left border-collapse border border-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="p-2 border border-slate-200">Produit</th>
                <th className="p-2 border border-slate-200">Qté</th>
                <th className="p-2 border border-slate-200">Client</th>
                {isAdmin && (
                  <>
                    <th className="p-2 border border-slate-200">P. Achat U</th>
                    <th className="p-2 border border-slate-200">P. Vente T</th>
                    <th className="p-2 border border-slate-200">Bénéfice T</th>
                  </>
                )}
                <th className="p-2 border border-slate-200">Vendu par</th>
                <th className="p-2 border border-slate-200">Date</th>
              </tr>
            </thead>
            <tbody>
              {flatRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-200 capitalize">
                    {row.nom_produit}
                  </td>
                  <td className="p-2 border border-slate-200 font-bold">
                    {row.quantite} {row.unite_label}
                  </td>
                  <td className="p-2 border border-slate-200 capitalize">
                    {row.nom_client}
                  </td>
                  {isAdmin && (
                    <>
                      <td className="p-2 border border-slate-200">
                        {row.prix_achat_u.toLocaleString()} FC
                      </td>
                      <td className="p-2 border border-slate-200">
                        {row.prix_vente_t.toLocaleString()} FC
                      </td>
                      <td
                        className={`p-2 border border-slate-200 font-semibold ${
                          row.benefice_t > 0
                            ? "text-emerald-600"
                            : row.benefice_t < 0
                              ? "text-rose-600"
                              : "text-slate-400"
                        }`}
                      >
                        {row.benefice_t.toLocaleString()} FC
                      </td>
                    </>
                  )}
                  <td className="p-2 border border-slate-200 capitalize">
                    {row.vendeur_nom}
                  </td>
                  <td className="p-2 border border-slate-200">
                    {new Date(row.dateVente).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
            {isAdmin && (
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td
                    colSpan="4"
                    className="p-2 border border-slate-200 uppercase"
                  >
                    Totaux
                  </td>
                  <td className="p-2 border border-slate-200">
                    {totals.totalVente.toLocaleString()} FC
                  </td>
                  <td
                    className={`p-2 border border-slate-200 ${
                      totals.totalBenefice > 0
                        ? "text-emerald-600"
                        : totals.totalBenefice < 0
                          ? "text-rose-600"
                          : "text-slate-400"
                    }`}
                  >
                    {totals.totalBenefice.toLocaleString()} FC
                  </td>
                  <td colSpan="2" className="p-2 border border-slate-200"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Layout>
  );
}
