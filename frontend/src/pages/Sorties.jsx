import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSorties, createSortie } from "../api/sortie.api";
import { getProducts } from "../api/product.api";
import {
  getStockSecondaire,
  getFacturesInternes,
  facturerInterné,
  ajouterArticlesInterne,
} from "../api/stockSecondaire.api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  PackageMinus,
  ChevronDown,
  Building2,
  ReceiptText,
  Users,
  PlusCircle,
  X,
  PlusSquare,
  Printer,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Receipt } from "../components/Receipt";

export default function Sorties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("transfert");

  // Formulaire Sortie / Transfert vers Stock Secondaire
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [serviceBeneficiaire, setServiceBeneficiaire] = useState("");
  const [motif, setMotif] = useState("");
  const [cartItems, setCartItems] = useState([]);

  // Formulaire première facturation interné
  const [patientNom, setPatientNom] = useState("");
  const [chambreNum, setChambreNum] = useState("");
  const [cartInternes, setCartInternes] = useState([]);
  const [selectedSecId, setSelectedSecId] = useState("");
  const [quantiteInterne, setQuantiteInterne] = useState(1);

  // Modale pour l'ajout de consommation (J+1, J+2...)
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [addCartItems, setAddCartItems] = useState([]);
  const [addSecId, setAddSecId] = useState("");
  const [addQuantite, setAddQuantite] = useState(1);
  const [addSecSearch, setAddSecSearch] = useState("");
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const addDropdownRef = useRef(null);

  // Modale détails facture
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [factureDetail, setFactureDetail] = useState(null);

  // Impression des reçus / factures
  const [lastSaleToPrint, setLastSaleToPrint] = useState(null);
  const receiptRef = useRef();
  const handlePrintReceipt = useReactToPrint({
    contentRef: () => receiptRef.current,
    documentTitle: `Facture_Interne_${lastSaleToPrint?.id || Date.now()}`,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Dropdowns filtres
  const [productSearch, setProductSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [secSearch, setSecSearch] = useState("");
  const [isSecDropdownOpen, setIsSecDropdownOpen] = useState(false);
  const secDropdownRef = useRef(null);

  // Pagination Historique Transferts
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Pagination Tableaux (Patients Internés & Stock Secondaire) limités à 5 par page
  const [searchInternes, setSearchInternes] = useState("");
  const [pageInternes, setPageInternes] = useState(1);
  const limitInternes = 5;

  const [searchStockSec, setSearchStockSec] = useState("");
  const [pageStockSec, setPageStockSec] = useState(1);
  const limitStockSec = 5;

  // Requetes
  const { data: productsData = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await getProducts()).data,
  });

  const { data: sortiesData = [] } = useQuery({
    queryKey: ["sorties"],
    queryFn: async () => (await getSorties()).data,
  });

  const { data: stockSecData = [] } = useQuery({
    queryKey: ["stock-secondaire"],
    queryFn: async () => (await getStockSecondaire()).data,
  });

  const { data: facturesInternesData = [] } = useQuery({
    queryKey: ["factures-internes"],
    queryFn: async () => (await getFacturesInternes()).data,
  });

  const products = useMemo(
    () =>
      Array.isArray(productsData) ? productsData : productsData.data || [],
    [productsData],
  );
  const sorties = useMemo(
    () => (Array.isArray(sortiesData) ? sortiesData : sortiesData.data || []),
    [sortiesData],
  );
  const stockSecondaire = useMemo(
    () =>
      Array.isArray(stockSecData) ? stockSecData : stockSecData.data || [],
    [stockSecData],
  );
  const facturesInternes = useMemo(
    () =>
      Array.isArray(facturesInternesData)
        ? facturesInternesData
        : facturesInternesData.data || [],
    [facturesInternesData],
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsDropdownOpen(false);
      if (
        secDropdownRef.current &&
        !secDropdownRef.current.contains(event.target)
      )
        setIsSecDropdownOpen(false);
      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(event.target)
      )
        setIsAddDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProduct = products.find(
    (p) => p.id === parseInt(selectedProductId, 10),
  );
  const filteredProducts = products.filter((p) =>
    p.nom?.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const selectedStockSecItem = stockSecondaire.find(
    (s) => s.id === parseInt(selectedSecId, 10),
  );
  const filteredStockSec = stockSecondaire.filter((s) =>
    s.produit?.nom?.toLowerCase().includes(secSearch.toLowerCase()),
  );

  const selectedAddSecItem = stockSecondaire.find(
    (s) => s.id === parseInt(addSecId, 10),
  );
  const filteredAddStockSec = stockSecondaire.filter((s) =>
    s.produit?.nom?.toLowerCase().includes(addSecSearch.toLowerCase()),
  );

  // Mutations
  const createSortieMutation = useMutation({
    mutationFn: createSortie,
    onSuccess: () => {
      queryClient.invalidateQueries(["sorties"]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["stock-secondaire"]);
      setSuccessMsg(
        "Sortie enregistrée et stock secondaire approvisionné avec succès !",
      );
      setErrorMsg("");
      setCartItems([]);
      setServiceBeneficiaire("");
      setMotif("");
      setSelectedProductId("");
      setQuantite(1);
    },
    onError: (err) => {
      setErrorMsg(
        err.response?.data?.message ||
          "Erreur lors de l'enregistrement de la sortie",
      );
      setSuccessMsg("");
    },
  });

  const facturerInterneMutation = useMutation({
    mutationFn: facturerInterné,
    onSuccess: () => {
      queryClient.invalidateQueries(["stock-secondaire"]);
      queryClient.invalidateQueries(["factures-internes"]);
      setSuccessMsg("Patient hospitalisé admis et facturé avec succès !");
      setErrorMsg("");
      setCartInternes([]);
      setPatientNom("");
      setChambreNum("");
      setSelectedSecId("");
      setQuantiteInterne(1);
    },
    onError: (err) => {
      setErrorMsg(
        err.response?.data?.message ||
          "Erreur lors de la facturation de l'interné",
      );
      setSuccessMsg("");
    },
  });

  const ajouterConsommationMutation = useMutation({
    mutationFn: ({ id, payload }) => ajouterArticlesInterne(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["stock-secondaire"]);
      queryClient.invalidateQueries(["factures-internes"]);
      setSuccessMsg(
        "Consommations ajoutées avec succès à la facture du patient !",
      );
      setErrorMsg("");
      closeAddModal();
    },
    onError: (err) => {
      setErrorMsg(
        err.response?.data?.message ||
          "Erreur lors de l'ajout des consommations",
      );
      setSuccessMsg("");
    },
  });

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(quantite, 10);
    if (isNaN(qty) || qty <= 0) return;

    const existingInCart = cartItems.find(
      (item) => item.id_produit === selectedProduct.id,
    );
    const currentQtyInCart = existingInCart ? existingInCart.quantite : 0;
    const availableStock = selectedProduct.quantite - currentQtyInCart;

    if (qty > availableStock) {
      setErrorMsg(
        `Stock principal insuffisant pour "${selectedProduct.nom}". ${availableStock} unités disponibles.`,
      );
      return;
    }

    if (existingInCart) {
      setCartItems(
        cartItems.map((item) =>
          item.id_produit === selectedProduct.id
            ? { ...item, quantite: item.quantite + qty }
            : item,
        ),
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          id_produit: selectedProduct.id,
          nom: selectedProduct.nom,
          quantite: qty,
          unite:
            selectedProduct.UniteQte?.label ||
            selectedProduct.unite?.label ||
            "",
        },
      ]);
    }
    setSelectedProductId("");
    setQuantite(1);
    setErrorMsg("");
  };

  const handleAddToInterneCart = () => {
    if (!selectedStockSecItem) return;
    const qty = parseInt(quantiteInterne, 10);
    if (isNaN(qty) || qty <= 0) return;

    const existing = cartInternes.find(
      (item) => item.stock_sec_id === selectedStockSecItem.id,
    );
    const currentQty = existing ? existing.quantite : 0;
    const availableSecStock = selectedStockSecItem.quantite - currentQty;

    if (qty > availableSecStock) {
      setErrorMsg(
        `Stock secondaire insuffisant. Seulement ${availableSecStock} unités disponibles.`,
      );
      return;
    }

    if (existing) {
      setCartInternes(
        cartInternes.map((i) =>
          i.stock_sec_id === selectedStockSecItem.id
            ? {
                ...i,
                quantite: i.quantite + qty,
                total: (i.quantite + qty) * i.prix_vente,
              }
            : i,
        ),
      );
    } else {
      setCartInternes([
        ...cartInternes,
        {
          stock_sec_id: selectedStockSecItem.id,
          produit_id: selectedStockSecItem.produit_id,
          nom: selectedStockSecItem.produit?.nom,
          quantite: qty,
          prix_vente: selectedStockSecItem.produit?.prix_vente || 0,
          total: qty * (selectedStockSecItem.produit?.prix_vente || 0),
        },
      ]);
    }
    setSelectedSecId("");
    setQuantiteInterne(1);
    setErrorMsg("");
  };

  const handleAddToAddCart = () => {
    if (!selectedAddSecItem) return;
    const qty = parseInt(addQuantite, 10);
    if (isNaN(qty) || qty <= 0) return;

    const existing = addCartItems.find(
      (item) => item.stock_sec_id === selectedAddSecItem.id,
    );
    const currentQty = existing ? existing.quantite : 0;
    const availableSecStock = selectedAddSecItem.quantite - currentQty;

    if (qty > availableSecStock) {
      setErrorMsg(
        `Stock secondaire insuffisant. Seulement ${availableSecStock} unités disponibles.`,
      );
      return;
    }

    if (existing) {
      setAddCartItems(
        addCartItems.map((i) =>
          i.stock_sec_id === selectedAddSecItem.id
            ? {
                ...i,
                quantite: i.quantite + qty,
                total: (i.quantite + qty) * i.prix_vente,
              }
            : i,
        ),
      );
    } else {
      setAddCartItems([
        ...addCartItems,
        {
          stock_sec_id: selectedAddSecItem.id,
          produit_id: selectedAddSecItem.produit_id,
          nom: selectedAddSecItem.produit?.nom,
          quantite: qty,
          prix_vente: selectedAddSecItem.produit?.prix_vente || 0,
          total: qty * (selectedAddSecItem.produit?.prix_vente || 0),
        },
      ]);
    }
    setAddSecId("");
    setAddQuantite(1);
    setErrorMsg("");
  };

  const totalInternesAmount = useMemo(
    () => cartInternes.reduce((acc, i) => acc + i.total, 0),
    [cartInternes],
  );
  const totalAddAmount = useMemo(
    () => addCartItems.reduce((acc, i) => acc + i.total, 0),
    [addCartItems],
  );

  const handleSubmitTransfert = (e) => {
    e.preventDefault();
    if (cartItems.length === 0 || !serviceBeneficiaire.trim()) {
      setErrorMsg(
        "Remplissez le service destinataire et ajoutez au moins un produit.",
      );
      return;
    }
    createSortieMutation.mutate({
      service_beneficiaire: serviceBeneficiaire.trim(),
      motif: motif.trim(),
      user_id: user?.id,
      items: cartItems.map((i) => ({
        id_produit: i.id_produit,
        quantite: i.quantite,
      })),
    });
  };

  const handleSubmitFactureInterne = (e) => {
    e.preventDefault();
    if (cartInternes.length === 0 || !patientNom.trim()) {
      setErrorMsg(
        "Renseignez le nom du patient et sélectionnez ses médicaments.",
      );
      return;
    }
    facturerInterneMutation.mutate({
      patient_nom: patientNom.trim(),
      chambre: chambreNum.trim(),
      user_id: user?.id,
      items: cartInternes.map((i) => ({
        stock_sec_id: i.stock_sec_id,
        quantite: i.quantite,
      })),
    });
  };

  const handleSubmitAddConsommations = (e) => {
    e.preventDefault();
    if (!selectedFacture || addCartItems.length === 0) return;
    ajouterConsommationMutation.mutate({
      id: selectedFacture.id,
      payload: {
        items: addCartItems.map((i) => ({
          stock_sec_id: i.stock_sec_id,
          quantite: i.quantite,
        })),
      },
    });
  };

  const openAddModal = (facture) => {
    setSelectedFacture(facture);
    setAddCartItems([]);
    setAddSecId("");
    setAddQuantite(1);
    setAddSecSearch("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedFacture(null);
    setAddCartItems([]);
  };

  const handlePrintFacture = (facture) => {
    const formattedData = {
      id: facture.id,
      user_name: user?.name || user?.nom || "Personnel",
      nom_client: facture.nom_client || "Patient Hospitalisé",
      date: facture.createdAt || facture.dateVente,
      items:
        facture.items?.map((it) => ({
          nom: it.produit?.nom || "Médicament",
          quantite: it.quantite,
          prix_unitaire: it.prix_unitaire || it.total_ligne / it.quantite || 0,
        })) || [],
      total: facture.total || 0,
    };
    setLastSaleToPrint(formattedData);
    setTimeout(() => handlePrintReceipt(), 250);
  };

  // Traitement tableau historique des sorties avec extraction de l'unité de quantité
  const flatRows = useMemo(() => {
    const rows = [];
    sorties.forEach((sortie) => {
      sortie.items?.forEach((item) => {
        const uniteLabel =
          item.produit?.UniteQte?.label || item.produit?.unite?.label || "";
        rows.push({
          id: sortie.id,
          nom_produit: item.produit?.nom || "Produit inconnu",
          quantite: item.quantite,
          unite: uniteLabel,
          service_beneficiaire: sortie.service_beneficiaire,
          motif: sortie.motif || "-",
          agent: sortie.user?.name || "Système",
          dateSortie: sortie.createdAt || sortie.dateSortie,
        });
      });
    });
    return rows;
  }, [sorties]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return flatRows.filter(
      (r) =>
        r.nom_produit.toLowerCase().includes(q) ||
        r.service_beneficiaire.toLowerCase().includes(q),
    );
  }, [flatRows, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  // LOGIQUE FILTRE ET PAGINATION POUR LES TABLEAUX DE L'ONGLET 2 (Limité à 5 par page)
  const filteredInternes = useMemo(() => {
    const q = searchInternes.toLowerCase();
    return facturesInternes.filter((f) =>
      (f.nom_client || "").toLowerCase().includes(q),
    );
  }, [facturesInternes, searchInternes]);

  const totalPagesInternes = Math.ceil(filteredInternes.length / limitInternes);
  const startInternesIndex = (pageInternes - 1) * limitInternes;
  const currentInternesRows = filteredInternes.slice(
    startInternesIndex,
    startInternesIndex + limitInternes,
  );

  const filteredStockSecTable = useMemo(() => {
    const q = searchStockSec.toLowerCase();
    return stockSecondaire.filter((s) =>
      (s.produit?.nom || "").toLowerCase().includes(q),
    );
  }, [stockSecondaire, searchStockSec]);

  const totalPagesStockSec = Math.ceil(
    filteredStockSecTable.length / limitStockSec,
  );
  const startStockSecIndex = (pageStockSec - 1) * limitStockSec;
  const currentStockSecRows = filteredStockSecTable.slice(
    startStockSecIndex,
    startStockSecIndex + limitStockSec,
  );

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-amber-600 tracking-tight flex items-center gap-2">
            <PackageMinus className="w-7 h-7 text-amber-600" /> Stock Secondaire
            & Hospitalisation
          </h1>
          <p className="text-sm text-slate-500">
            Alimentez le stock secondaire et facturez les patients hospitalisés
            au fur et à mesure
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("transfert")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "transfert" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Sorties & Alimentation Stock
          </button>
          <button
            onClick={() => setActiveTab("facturation_internes")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "facturation_internes" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}
          >
            Facturation Patients Internés
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* ONGLET 1 : TRANSFERTS ET ALIMENTATION */}
      {activeTab === "transfert" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-amber-600" /> Sortie vers
              Stock Secondaire
            </h2>

            <div className="space-y-3">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Produit (Stock Principal)
                </label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-left flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={
                      selectedProduct
                        ? "font-medium text-slate-900"
                        : "text-slate-400"
                    }
                  >
                    {selectedProduct
                      ? `${selectedProduct.nom} (Stock : ${selectedProduct.quantite})`
                      : "-- Choisir --"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      autoFocus
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                    />
                    <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(p.id.toString());
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer"
                        >
                          <span>{p.nom}</span>
                          <span className="text-slate-400">
                            Stock: {p.quantite}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quantité
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedProductId}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter à la liste
              </button>
            </div>

            {cartItems.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cartItems.map((item) => (
                  <div
                    key={item.id_produit}
                    className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-xs"
                  >
                    <span>
                      {item.nom} (Qté: {item.quantite} {item.unite})
                    </span>
                    <button
                      onClick={() =>
                        setCartItems(
                          cartItems.filter(
                            (i) => i.id_produit !== item.id_produit,
                          ),
                        )
                      }
                      className="text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmitTransfert} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Destinataire *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hospitalisation / Stock Secondaire"
                  value={serviceBeneficiaire}
                  onChange={(e) => setServiceBeneficiaire(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={
                  createSortieMutation.isLoading || cartItems.length === 0
                }
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl shadow-md text-xs cursor-pointer"
              >
                {createSortieMutation.isLoading
                  ? "Validation..."
                  : "Transférer au Stock Secondaire"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900">
                  Historique des Transferts de Stock
                </h2>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-64"
                />
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-6">Produit</th>
                    <th className="py-3 px-6">Qté Transférée</th>
                    <th className="py-3 px-6">Service</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6 font-semibold text-slate-900 capitalize">
                        {row.nom_produit}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-amber-600">
                        +{row.quantite} {row.unite}
                      </td>
                      <td className="py-3.5 px-6 capitalize">
                        {row.service_beneficiaire}
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 text-xs">
                        {new Date(row.dateSortie).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ONGLET 2 : FACTURATION INTERNES ET GESTION EVOLUTIVE */}
      {activeTab === "facturation_internes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-amber-600" /> Nouveau facture
              d'un Patient Hospitalisé
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom du Patient *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jean Mukendi"
                  value={patientNom}
                  onChange={(e) => setPatientNom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chambre / Lit
                </label>
                <input
                  type="text"
                  placeholder="Ex: Chambre 04"
                  value={chambreNum}
                  onChange={(e) => setChambreNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div className="relative" ref={secDropdownRef}>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Médicament (Stock Secondaire)
                </label>
                <button
                  type="button"
                  onClick={() => setIsSecDropdownOpen(!isSecDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-left flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={
                      selectedStockSecItem
                        ? "font-medium text-slate-900"
                        : "text-slate-400"
                    }
                  >
                    {selectedStockSecItem
                      ? `${selectedStockSecItem.produit?.nom} (Dispo: ${selectedStockSecItem.quantite})`
                      : "-- Choisir --"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {isSecDropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={secSearch}
                      onChange={(e) => setSecSearch(e.target.value)}
                      autoFocus
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                    />
                    <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                      {filteredStockSec.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedSecId(item.id.toString());
                            setIsSecDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer"
                        >
                          <span>{item.produit?.nom}</span>
                          <span className="text-teal-600 font-bold">
                            Dispo: {item.quantite}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quantité
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantiteInterne}
                  onChange={(e) => setQuantiteInterne(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleAddToInterneCart}
                disabled={!selectedSecId}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter à la facture initiale
              </button>
            </div>

            {cartInternes.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
                {cartInternes.map((i) => (
                  <div
                    key={i.stock_sec_id}
                    className="flex justify-between items-center p-2 bg-slate-50 rounded-xl text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{i.nom}</p>
                      <p className="text-[10px] text-slate-500">
                        {i.quantite} x {i.prix_vente.toLocaleString()} FC
                      </p>
                    </div>
                    <span className="font-bold text-slate-800">
                      {i.total.toLocaleString()} FC
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmitFactureInterne}
              className="pt-3 border-t border-slate-100 space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">
                  Total initial :
                </span>
                <span className="text-xl font-black text-teal-600">
                  {totalInternesAmount.toLocaleString()} FC
                </span>
              </div>
              <button
                type="submit"
                disabled={
                  facturerInterneMutation.isLoading || cartInternes.length === 0
                }
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {facturerInterneMutation.isLoading
                  ? "Facturation..."
                  : "Valider l'Admission"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* TABLEAU 1 : PATIENTS HOSPITALISÉS & FACTURATION ÉVOLUTIVE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" /> Patients
                    Hospitalisés & Facturation Évolutive
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par patient..."
                      value={searchInternes}
                      onChange={(e) => {
                        setSearchInternes(e.target.value);
                        setPageInternes(1);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Patient / Chambre</th>
                        <th className="py-3 px-4">Date Admission</th>
                        <th className="py-3 px-4">Total Facture</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {currentInternesRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="py-6 text-center text-slate-400 text-xs italic"
                          >
                            Aucun patient hospitalisé trouvé.
                          </td>
                        </tr>
                      ) : (
                        currentInternesRows.map((facture) => (
                          <tr key={facture.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-semibold text-slate-900 capitalize">
                              {facture.nom_client}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                Facture #{facture.id}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600">
                              {new Date(
                                facture.createdAt || facture.dateVente,
                              ).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="py-3.5 px-4 font-black text-teal-600">
                              {facture.total?.toLocaleString()} FC
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openAddModal(facture)}
                                  className="px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Ajouter des médicaments (J+1, J+2...)"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" /> Conso
                                </button>
                                <button
                                  onClick={() => handlePrintFacture(facture)}
                                  className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs transition-all cursor-pointer"
                                  title="Imprimer la facture"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setFactureDetail(facture);
                                    setShowDetailModal(true);
                                  }}
                                  className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs transition-all cursor-pointer"
                                  title="Voir plus de détails"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredInternes.length > 0 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Affichage {startInternesIndex + 1} à{" "}
                    {Math.min(
                      startInternesIndex + limitInternes,
                      filteredInternes.length,
                    )}{" "}
                    sur {filteredInternes.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPageInternes((p) => Math.max(p - 1, 1))}
                      disabled={pageInternes === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-700 px-1">
                      {pageInternes} / {totalPagesInternes || 1}
                    </span>
                    <button
                      onClick={() =>
                        setPageInternes((p) =>
                          Math.min(p + 1, totalPagesInternes),
                        )
                      }
                      disabled={
                        pageInternes === totalPagesInternes ||
                        totalPagesInternes === 0
                      }
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TABLEAU 2 : QUANTITÉS DISPONIBLES AU STOCK SECONDAIRE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" /> Quantités
                    Disponibles au Stock Secondaire
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer médicament..."
                      value={searchStockSec}
                      onChange={(e) => {
                        setSearchStockSec(e.target.value);
                        setPageStockSec(1);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Médicament</th>
                        <th className="py-3 px-4">Quantité Interne</th>
                        <th className="py-3 px-4 text-right">Prix Unitaire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {currentStockSecRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan="3"
                            className="py-6 text-center text-slate-400 text-xs italic"
                          >
                            Aucun médicament trouvé dans le stock secondaire.
                          </td>
                        </tr>
                      ) : (
                        currentStockSecRows.map((s) => {
                          const uniteLabel =
                            s.produit?.UniteQte?.label ||
                            s.produit?.unite?.label ||
                            "";
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 font-semibold text-slate-900 capitalize">
                                {s.produit?.nom}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-teal-600">
                                {s.quantite} {uniteLabel}
                              </td>
                              <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                                {s.produit?.prix_vente?.toLocaleString()} FC
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredStockSecTable.length > 0 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Affichage {startStockSecIndex + 1} à{" "}
                    {Math.min(
                      startStockSecIndex + limitStockSec,
                      filteredStockSecTable.length,
                    )}{" "}
                    sur {filteredStockSecTable.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPageStockSec((p) => Math.max(p - 1, 1))}
                      disabled={pageStockSec === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-slate-700 px-1">
                      {pageStockSec} / {totalPagesStockSec || 1}
                    </span>
                    <button
                      onClick={() =>
                        setPageStockSec((p) =>
                          Math.min(p + 1, totalPagesStockSec),
                        )
                      }
                      disabled={
                        pageStockSec === totalPagesStockSec ||
                        totalPagesStockSec === 0
                      }
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'AJOUT PROGRESSIF DES CONSOMMATIONS (J+1, J+2...) */}
      {showAddModal && selectedFacture && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeAddModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">
              Ajouter une consommation à la Facture #{selectedFacture.id}
            </h2>
            <p className="text-xs text-slate-500 mb-4 capitalize">
              Patient : {selectedFacture.nom_client}
            </p>

            <div className="space-y-3">
              <div className="relative" ref={addDropdownRef}>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Médicament (Stock Secondaire)
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-left flex items-center justify-between cursor-pointer"
                >
                  <span
                    className={
                      selectedAddSecItem
                        ? "font-medium text-slate-900"
                        : "text-slate-400"
                    }
                  >
                    {selectedAddSecItem
                      ? `${selectedAddSecItem.produit?.nom} (Dispo: ${selectedAddSecItem.quantite})`
                      : "-- Sélectionner --"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {isAddDropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={addSecSearch}
                      onChange={(e) => setAddSecSearch(e.target.value)}
                      autoFocus
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                    />
                    <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                      {filteredAddStockSec.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setAddSecId(item.id.toString());
                            setIsAddDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex justify-between cursor-pointer"
                        >
                          <span>{item.produit?.nom}</span>
                          <span className="text-teal-600 font-bold">
                            Dispo: {item.quantite}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quantité à rajouter
                </label>
                <input
                  type="number"
                  min="1"
                  value={addQuantite}
                  onChange={(e) => setAddQuantite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleAddToAddCart}
                disabled={!addSecId}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusSquare className="w-4 h-4" /> Ajouter à la liste
              </button>
            </div>

            {addCartItems.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
                {addCartItems.map((item) => (
                  <div
                    key={item.stock_sec_id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                  >
                    <div className="truncate">
                      <p className="font-semibold text-slate-900">{item.nom}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.quantite} x {item.prix_vente.toLocaleString()} FC
                      </p>
                    </div>
                    <span className="font-bold text-slate-800">
                      {item.total.toLocaleString()} FC
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmitAddConsommations}
              className="mt-4 pt-3 border-t border-slate-100 space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">
                  Nouveau montant à rajouter :
                </span>
                <span className="text-lg font-black text-teal-600">
                  {totalAddAmount.toLocaleString()} FC
                </span>
              </div>
              <button
                type="submit"
                disabled={
                  ajouterConsommationMutation.isLoading ||
                  addCartItems.length === 0
                }
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all text-xs cursor-pointer"
              >
                {ajouterConsommationMutation.isLoading
                  ? "Enregistrement..."
                  : "Confirmer la rajoute sur la facture"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALE "VOIR PLUS DE DÉTAILS" */}
      {showDetailModal && factureDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">
              Détails de la Facture #{factureDetail.id}
            </h2>
            <p className="text-xs text-slate-500 mb-4 capitalize">
              Patient :{" "}
              <span className="font-semibold text-slate-700">
                {factureDetail.nom_client}
              </span>{" "}
              | Date :{" "}
              {new Date(
                factureDetail.createdAt || factureDetail.dateVente,
              ).toLocaleDateString("fr-FR")}
            </p>

            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-3">Médicament</th>
                    <th className="p-3">Qté</th>
                    <th className="p-3">P.U</th>
                    <th className="p-3 text-right">Total Ligne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {factureDetail.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-900 capitalize">
                        {it.produit?.nom}
                      </td>
                      <td className="p-3">{it.quantite}</td>
                      <td className="p-3">
                        {(
                          it.prix_unitaire || it.total_ligne / it.quantite
                        ).toLocaleString()}{" "}
                        FC
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        {(
                          it.total_ligne || it.quantite * it.prix_unitaire
                        ).toLocaleString()}{" "}
                        FC
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 uppercase">
                Montant Global :
              </span>
              <span className="text-lg font-black text-teal-600">
                {factureDetail.total?.toLocaleString()} FC
              </span>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openAddModal(factureDetail);
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Ajouter conso
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handlePrintFacture(factureDetail);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impression cachée */}
      <div className="hidden">
        <Receipt ref={receiptRef} saleData={lastSaleToPrint} />
      </div>
    </Layout>
  );
}
