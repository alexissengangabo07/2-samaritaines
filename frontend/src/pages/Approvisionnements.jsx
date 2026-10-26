import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts } from "../api/product.api";
import API from "../api/axios";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import {
  Truck,
  Plus,
  Search,
  Calendar,
  Package,
  Hash,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";

export default function Approvisionnements() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Récupère l'utilisateur connecté

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // États pour le Select personnalisé avec filtre
  const [productSearch, setProductSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Nombre d'éléments par page

  // Date du jour au format YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  // État du formulaire
  const [formData, setFormData] = useState({
    id_produit: "",
    quantite: "",
    prix_achat: "",
    date_expiration: "",
    numero_lot: "",
    dateApprovisionnement: today,
  });

  // Récupérer la liste des médicaments/produits
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await getProducts()).data,
  });

  // Récupérer la liste des approvisionnements
  const {
    data: approvisionnements = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["approvisionnements"],
    queryFn: async () => (await API.get("/approvisionnements")).data,
  });

  // Fermer le menu déroulant lors du clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mutation pour créer un approvisionnement
  const createApproMutation = useMutation({
    mutationFn: (data) => API.post("/approvisionnements", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["approvisionnements"]);
      queryClient.invalidateQueries(["products"]);
      setIsModalOpen(false);
      setErrorMsg("");
      setFormData({
        id_produit: "",
        quantite: "",
        prix_achat: "",
        date_expiration: "",
        numero_lot: "",
        dateApprovisionnement: today,
      });
      setProductSearch("");
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de l'enregistrement de l'approvisionnement";
      setErrorMsg(msg);
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.id_produit) {
      setErrorMsg("Veuillez sélectionner un produit");
      return;
    }

    const payload = {
      id_produit: parseInt(formData.id_produit, 10),
      quantite: parseInt(formData.quantite, 10),
      prix_achat: parseFloat(formData.prix_achat),
      date_expiration: formData.date_expiration,
      numero_lot: formData.numero_lot,
      id_utilisateur: user?.id,
      dateApprovisionnement: formData.dateApprovisionnement,
    };

    createApproMutation.mutate(payload);
  };

  // Filtrer la liste des médicaments du dropdown
  const filteredProducts = products.filter((p) =>
    p.nom?.toLowerCase().includes(productSearch.toLowerCase()),
  );

  // Produit actuellement sélectionné
  const selectedProduct = products.find(
    (p) => p.id === parseInt(formData.id_produit, 10),
  );

  const filteredApprovisionnements = approvisionnements.filter(
    (app) =>
      app.Product?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.numero_lot?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // LOGIQUE DE PAGINATION
  const totalPages = Math.ceil(
    filteredApprovisionnements.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentApprovisionnements = filteredApprovisionnements.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Approvisionnements
          </h1>
          <p className="text-sm text-slate-500">
            Enregistrez les entrées en stock et les lots de médicaments
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouvel approvisionnement
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6 relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par médicament ou numéro de lot..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
      </div>

      {/* Tableau des approvisionnements */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Chargement des réceptions...
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-rose-500 text-sm">
            Erreur lors de la récupération des données.
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Produit</th>
                  <th className="py-3.5 px-6">Quantité</th>
                  <th className="py-3.5 px-6">Prix d'Achat</th>
                  <th className="py-3.5 px-6">N° Lot</th>
                  <th className="py-3.5 px-6">Date Appro.</th>
                  <th className="py-3.5 px-6">Date Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentApprovisionnements.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-8 text-center text-slate-400 text-sm"
                    >
                      Aucun approvisionnement enregistré.
                    </td>
                  </tr>
                ) : (
                  currentApprovisionnements.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="capitalize">
                          {app.Product?.nom || "Produit inconnu"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        +{app.quantite}
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {app.prix_achat?.toLocaleString()} FC
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                        {app.numero_lot || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {app.dateApprovisionnement
                          ? new Date(
                              app.dateApprovisionnement,
                            ).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {app.date_expiration
                          ? new Date(app.date_expiration).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Barre de pagination */}
            {filteredApprovisionnements.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Affichage de{" "}
                  <span className="font-semibold">{startIndex + 1}</span> à{" "}
                  <span className="font-semibold">
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredApprovisionnements.length,
                    )}
                  </span>{" "}
                  sur{" "}
                  <span className="font-semibold">
                    {filteredApprovisionnements.length}
                  </span>{" "}
                  résultats
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL NOUVEL APPROVISIONNEMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Entrée en stock
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMsg("");
                  setProductSearch("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Select dynamique avec recherche intégrée */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Produit / Médicament *
                </label>

                {/* Bouton declencheur du menu */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
                >
                  <span
                    className={
                      selectedProduct
                        ? "text-slate-900 font-medium capitalize"
                        : "text-slate-400"
                    }
                  >
                    {selectedProduct
                      ? `${selectedProduct.nom} (Stock: ${selectedProduct.quantite})`
                      : "-- Sélectionner un médicament --"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
                    {/* Input de recherche dans la liste */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Rechercher un médicament..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                    </div>

                    {/* Liste filtrée */}
                    <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                      {filteredProducts.length === 0 ? (
                        <div className="py-3 text-center text-xs text-slate-400">
                          Aucun médicament trouvé
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected =
                            parseInt(formData.id_produit, 10) === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  id_produit: p.id.toString(),
                                });
                                setIsDropdownOpen(false);
                                setProductSearch("");
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-teal-50 text-teal-700 font-semibold"
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="capitalize">{p.nom}</span>
                              <div className="flex items-center gap-2 text-slate-400">
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                                  Stock: {p.quantite}
                                </span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-teal-600" />
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* quantite & prix_achat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    name="quantite"
                    value={formData.quantite}
                    onChange={handleChange}
                    placeholder="ex: 100"
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prix d'achat unitaire (FC) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="prix_achat"
                    value={formData.prix_achat}
                    onChange={handleChange}
                    placeholder="ex: 1500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    required
                  />
                </div>
              </div>

              {/* numero_lot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Numéro de lot *
                </label>
                <input
                  type="text"
                  name="numero_lot"
                  value={formData.numero_lot}
                  onChange={handleChange}
                  placeholder="ex: LOT-2026-089"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  required
                />
              </div>

              {/* dateApprovisionnement & date_expiration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date d'approvisionnement *
                  </label>
                  <input
                    type="date"
                    name="dateApprovisionnement"
                    value={formData.dateApprovisionnement}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date d'expiration *
                  </label>
                  <input
                    type="date"
                    name="date_expiration"
                    value={formData.date_expiration}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg("");
                    setProductSearch("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createApproMutation.isLoading}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {createApproMutation.isLoading
                    ? "Enregistrement..."
                    : "Valider l'entrée"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
