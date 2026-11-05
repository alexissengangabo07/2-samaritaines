import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVentesCredit, addPaiement } from "../api/vente.api";
import Layout from "../components/Layout";
import {
  Wallet,
  X,
  CheckCircle2,
  AlertCircle,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import Entete from "../assets/entete.png";

export default function CreditVentes() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedVente, setSelectedVente] = useState(null);
  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  // États pour les onglets de période ('all', 'today', 'week', 'month', 'year')
  const [activeTab, setActiveTab] = useState("all");

  // États pour la recherche et la pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const reportRef = useRef();

  const { data: ventesCredit = [] } = useQuery({
    queryKey: ["ventes-credit"],
    queryFn: async () => (await getVentesCredit()).data,
  });

  const handlePrintReport = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Rapport_Ventes_Credit_${new Date().toISOString().split("T")[0]}`,
  });

  // Filtrage combiné : par dateVente (onglets) puis par Texte (recherche)
  const filteredVentes = useMemo(() => {
    const now = new Date();

    // 1. Filtrage par onglet de période basé sur dateVente
    const periodFiltered = ventesCredit.filter((vente) => {
      // Utilisation de dateVente (avec repli sur createdAt si besoin)
      const dateRef = vente.dateVente || vente.createdAt;
      if (!dateRef) return true;
      const venteDate = new Date(dateRef);

      if (activeTab === "today") {
        return venteDate.toDateString() === now.toDateString();
      }
      if (activeTab === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return venteDate >= startOfWeek;
      }
      if (activeTab === "month") {
        return (
          venteDate.getMonth() === now.getMonth() &&
          venteDate.getFullYear() === now.getFullYear()
        );
      }
      if (activeTab === "year") {
        return venteDate.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });

    // 2. Filtrage par recherche textuelle
    const query = searchTerm.trim().toLowerCase();
    if (!query) return periodFiltered;

    return periodFiltered.filter((vente) => {
      const factureId = `#${vente.id}`.toLowerCase();
      const abonneNom = (
        vente.abonne?.nom ||
        vente.nom_client ||
        ""
      ).toLowerCase();
      const entrepriseNom = (vente.abonne?.entreprise?.nom || "").toLowerCase();

      return (
        factureId.includes(query) ||
        abonneNom.includes(query) ||
        entrepriseNom.includes(query)
      );
    });
  }, [ventesCredit, activeTab, searchTerm]);

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredVentes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentVentes = filteredVentes.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Calcul des totaux globaux comptables sur l'ensemble filtré (période + recherche)
  const totauxComptables = useMemo(() => {
    return filteredVentes.reduce(
      (acc, vente) => {
        acc.totalFacture += parseFloat(vente.total || 0);
        acc.totalRecouvre += parseFloat(vente.montant_paye || 0);
        acc.totalSoldeDu += parseFloat(vente.solde || 0);
        return acc;
      },
      { totalFacture: 0, totalRecouvre: 0, totalSoldeDu: 0 },
    );
  }, [filteredVentes]);

  const openPaiementModal = (vente) => {
    setSelectedVente(vente);
    setMontant("");
    setModePaiement("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVente(null);
  };

  const paiementMutation = useMutation({
    mutationFn: (data) => addPaiement(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["ventes-credit"]);
      setMessage({ type: "success", text: "Paiement enregistré avec succès." });
      closeModal();
    },
    onError: (err) =>
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Erreur lors du paiement.",
      }),
  });

  const handleSubmitPaiement = (e) => {
    e.preventDefault();
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      setMessage({ type: "error", text: "Montant invalide." });
      return;
    }
    if (montantNum > selectedVente.solde) {
      setMessage({
        type: "error",
        text: `Le montant dépasse le solde dû (${selectedVente.solde.toLocaleString()} FC).`,
      });
      return;
    }
    paiementMutation.mutate({
      vente_id: selectedVente.id,
      montant: montantNum,
      mode_paiement: modePaiement || undefined,
    });
  };

  const statutBadge = (statut) => {
    const styles = {
      non_payé: "bg-rose-50 text-rose-700 border-rose-200",
      partiel: "bg-amber-50 text-amber-700 border-amber-200",
      payé: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    const labels = { non_payé: "Non payé", partiel: "Partiel", payé: "Soldé" };
    return (
      <span
        className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${styles[statut]}`}
      >
        {labels[statut]}
      </span>
    );
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ventes à Crédit (Abonnés)
          </h1>
          <p className="text-sm text-slate-500">
            Suivi comptable des soldes dus et des encaissements
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          disabled={filteredVentes.length === 0}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-40"
        >
          <Printer className="w-4 h-4" /> Imprimer le rapport
        </button>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Barre d'onglets de filtrage par période */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setActiveTab("all");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Tous ({ventesCredit.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("today");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "today"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => {
            setActiveTab("week");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "week"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Cette semaine
        </button>
        <button
          onClick={() => {
            setActiveTab("month");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "month"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Ce mois
        </button>
        <button
          onClick={() => {
            setActiveTab("year");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "year"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Cette année
        </button>
      </div>

      {/* Champ de recherche */}
      <div className="mb-4 relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par facture, abonné, entreprise..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-sm"
        />
      </div>

      {/* Tableau de suivi comptable principal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">N° Facture</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Abonné</th>
                <th className="py-3 px-6">Entreprise (Tiers)</th>
                <th className="py-3 px-6 text-right">Montant Brut (Facturé)</th>
                <th className="py-3 px-6 text-right">
                  Montant Recouvré (Payé)
                </th>
                <th className="py-3 px-6 text-right">Solde Dû (Créance)</th>
                <th className="py-3 px-6 text-center">État de Recouvrement</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentVentes.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="py-8 text-center text-slate-400 text-sm"
                  >
                    Aucune vente à crédit ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                currentVentes.map((vente) => {
                  const dateVenteFormatee = vente.dateVente
                    ? new Date(vente.dateVente).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";
                  return (
                    <tr key={vente.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        #{vente.id}
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-500">
                        {dateVenteFormatee}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 capitalize">
                        {vente.abonne?.nom || vente.nom_client}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
                        {vente.abonne?.entreprise?.nom || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {vente.total.toLocaleString()} FC
                      </td>
                      <td className="py-3.5 px-6 text-right text-emerald-600 font-semibold">
                        {vente.montant_paye.toLocaleString()} FC
                      </td>
                      <td className="py-3.5 px-6 text-right text-rose-600 font-bold">
                        {vente.solde.toLocaleString()} FC
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {statutBadge(vente.statut_paiement)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {vente.solde > 0 && (
                          <button
                            onClick={() => openPaiementModal(vente)}
                            className="flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-[11px] font-bold ml-auto cursor-pointer"
                          >
                            <Wallet className="w-3.5 h-3.5" /> Encaisser
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredVentes.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 border-t-2 border-slate-200 text-sm font-bold text-slate-900">
                  <td
                    colSpan="4"
                    className="py-3.5 px-6 uppercase text-xs tracking-wider text-slate-600"
                  >
                    Totaux Généraux / Balance des Comptes
                  </td>
                  <td className="py-3.5 px-6 text-right text-slate-900">
                    {totauxComptables.totalFacture.toLocaleString()} FC
                  </td>
                  <td className="py-3.5 px-6 text-right text-emerald-600">
                    {totauxComptables.totalRecouvre.toLocaleString()} FC
                  </td>
                  <td className="py-3.5 px-6 text-right text-rose-600 text-base">
                    {totauxComptables.totalSoldeDu.toLocaleString()} FC
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Contrôles de Pagination */}
        {filteredVentes.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Affichage de{" "}
              <span className="font-bold text-slate-700">{startIndex + 1}</span>{" "}
              à{" "}
              <span className="font-bold text-slate-700">
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredVentes.length)}
              </span>{" "}
              sur{" "}
              <span className="font-bold text-slate-700">
                {filteredVentes.length}
              </span>{" "}
              résultats
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Page {currentPage} sur {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale d'encaissement */}
      {showModal && selectedVente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Enregistrer un encaissement
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Facture #{selectedVente.id} — Créance restante :{" "}
              <span className="font-bold text-rose-600">
                {selectedVente.solde.toLocaleString()} FC
              </span>
            </p>

            <form onSubmit={handleSubmitPaiement} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Montant perçu
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedVente.solde}
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mode de règlement (optionnel)
                </label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="">-- Non précisé --</option>
                  <option value="espece">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="virement">Virement bancaire</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={paiementMutation.isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50 cursor-pointer"
              >
                {paiementMutation.isLoading
                  ? "Enregistrement..."
                  : "Confirmer le règlement"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modèle masqué pour l'impression du rapport comptable */}
      <div className="hidden">
        <div ref={reportRef} className="p-8 bg-white text-slate-900 font-sans">
          <img src={Entete} alt="Entête" className="mx-auto max-h-16 mb-4" />
          <h2 className="text-xl font-black uppercase tracking-wider mb-1 text-center">
            État des Créances & Ventes à Crédit
          </h2>
          <p className="text-xs text-slate-500 text-center mb-6">
            Date d'édition :{" "}
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase">
                <th className="p-2 border border-slate-300">N°</th>
                <th className="p-2 border border-slate-300">Date</th>
                <th className="p-2 border border-slate-300">Abonné</th>
                <th className="p-2 border border-slate-300">
                  Entreprise (Tiers)
                </th>
                <th className="p-2 border border-slate-300 text-right">
                  Montant Brut
                </th>
                <th className="p-2 border border-slate-300 text-right">
                  Montant Recouvré
                </th>
                <th className="p-2 border border-slate-300 text-right">
                  Solde Dû
                </th>
                <th className="p-2 border border-slate-300 text-center">
                  État
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVentes.map((vente) => {
                const dateVenteFormatee = vente.dateVente
                  ? new Date(vente.dateVente).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—";
                return (
                  <tr key={vente.id} className="border-b border-slate-200">
                    <td className="p-2 border border-slate-300 font-semibold">
                      #{vente.id}
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-600">
                      {dateVenteFormatee}
                    </td>
                    <td className="p-2 border border-slate-300 capitalize">
                      {vente.abonne?.nom || vente.nom_client}
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-600">
                      {vente.abonne?.entreprise?.nom || "—"}
                    </td>
                    <td className="p-2 border border-slate-300 text-right">
                      {vente.total.toLocaleString()} FC
                    </td>
                    <td className="p-2 border border-slate-300 text-right text-emerald-700">
                      {vente.montant_paye.toLocaleString()} FC
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-bold text-rose-700">
                      {vente.solde.toLocaleString()} FC
                    </td>
                    <td className="p-2 border border-slate-300 text-center uppercase text-[9px] font-bold">
                      {vente.statut_paiement === "payé"
                        ? "Soldé"
                        : vente.statut_paiement === "partiel"
                          ? "Partiel"
                          : "Non payé"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-xs">
                <td
                  colSpan="4"
                  className="p-2 border border-slate-300 uppercase"
                >
                  Totaux Généraux
                </td>
                <td className="p-2 border border-slate-300 text-right">
                  {totauxComptables.totalFacture.toLocaleString()} FC
                </td>
                <td className="p-2 border border-slate-300 text-right text-emerald-700">
                  {totauxComptables.totalRecouvre.toLocaleString()} FC
                </td>
                <td className="p-2 border border-slate-300 text-right text-rose-700">
                  {totauxComptables.totalSoldeDu.toLocaleString()} FC
                </td>
                <td className="p-2 border border-slate-300" colSpan="2"></td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-2 gap-8 text-xs mt-12 pt-8 border-t border-slate-200">
            <div className="text-center">
              <p className="font-bold mb-12">Le Service Comptabilité</p>
              <div className="border-b border-slate-400 w-48 mx-auto"></div>
            </div>
            <div className="text-center">
              <p className="font-bold mb-12">Visa de la Direction</p>
              <div className="border-b border-slate-400 w-48 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
