import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts } from "../api/product.api";
import {
  createVente,
  getVentes,
  addItemsToVente,
  deleteVente,
} from "../api/vente.api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  ShoppingBag,
  UserCheck,
  Percent,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Trash2,
  ShoppingCart,
  Eye,
  ChevronDown,
  Check,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Receipt } from "../components/Receipt";
import { useNavigate } from "react-router-dom";
import { getAbonnes } from "../api/abonne.api";

export default function Ventes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [lastSale, setLastSale] = useState(null);
  const receiptRef = useRef();

  // États panier
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [nom_client, setNomClient] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [typeVente, setTypeVente] = useState("comptant"); // 'comptant' | 'abonne'
  const [selectedAbonneId, setSelectedAbonneId] = useState("");
  const [selectedDependantId, setSelectedDependantId] = useState("");

  // États pour le Select personnalisé des abonnés avec filtre
  const [abonneSearch, setAbonneSearch] = useState("");
  const [isAbonneDropdownOpen, setIsAbonneDropdownOpen] = useState(false);
  const abonneDropdownRef = useRef(null);

  // États pour le Select personnalisé des dépendants avec filtre
  const [dependantSearch, setDependantSearch] = useState("");
  const [isDependantDropdownOpen, setIsDependantDropdownOpen] = useState(false);
  const dependantDropdownRef = useRef(null);

  // États pour le Select personnalisé principal avec filtre (Médicaments)
  const [productSearch, setProductSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Recherche & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal "Ajouter article à une facture existante"
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVente, setSelectedVente] = useState(null);
  const [addCartItems, setAddCartItems] = useState([]);
  const [addProductId, setAddProductId] = useState("");
  const [addQuantite, setAddQuantite] = useState(1);

  // États pour le Select personnalisé de la modale avec filtre
  const [addEspecialmenteSearch, setAddProductSearch] = useState("");
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const addDropdownRef = useRef(null);

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await getProducts()).data,
  });
  const { data: ventes = [] } = useQuery({
    queryKey: ["ventes"],
    queryFn: async () => (await getVentes()).data,
  });
  const { data: abonnes = [] } = useQuery({
    queryKey: ["abonnes"],
    queryFn: async () => (await getAbonnes()).data,
  });

  const selectedProduct = products.find(
    (p) => p.id === parseInt(selectedProductId),
  );
  const selectedAbonne = abonnes.find(
    (a) => a.id === parseInt(selectedAbonneId),
  );

  const selectedDependant = selectedAbonne?.dependants?.find(
    (d) => d.id === parseInt(selectedDependantId, 10),
  );

  // Fermer les menus déroulants lors du clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        abonneDropdownRef.current &&
        !abonneDropdownRef.current.contains(event.target)
      ) {
        setIsAbonneDropdownOpen(false);
      }
      if (
        dependantDropdownRef.current &&
        !dependantDropdownRef.current.contains(event.target)
      ) {
        setIsDependantDropdownOpen(false);
      }
      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(event.target)
      ) {
        setIsAddDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrage des abonnés, dépendants et produits
  const filteredAbonnes = abonnes.filter(
    (a) =>
      a.nom?.toLowerCase().includes(abonneSearch.toLowerCase()) ||
      a.entreprise?.nom?.toLowerCase().includes(abonneSearch.toLowerCase()),
  );

  const filteredDependants = selectedAbonne?.dependants
    ? selectedAbonne.dependants.filter(
        (d) =>
          d.nom?.toLowerCase().includes(dependantSearch.toLowerCase()) ||
          (d.lien &&
            d.lien.toLowerCase().includes(dependantSearch.toLowerCase())),
      )
    : [];

  const filteredProducts = products.filter((p) =>
    p.nom?.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const filteredAddProducts = products.filter((p) =>
    p.nom?.toLowerCase().includes(addEspecialmenteSearch.toLowerCase()),
  );

  const addProductSelected = products.find(
    (p) => p.id === parseInt(addProductId),
  );

  // Impression reçu
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Facture_Vente_${lastSale?.id || Date.now()}`,
  });

  // Panier
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(quantite);
    if (isNaN(qty) || qty <= 0) return;

    if (typeVente === "abonne" && !selectedAbonneId) {
      setMessage({
        type: "error",
        text: "Veuillez sélectionner un abonné avant d'ajouter un produit.",
      });
      return;
    }

    const existingInCart = cartItems.find(
      (item) => item.id_produit === selectedProduct.id,
    );
    const currentQtyInCart = existingInCart ? existingInCart.quantite : 0;
    const availableStock = selectedProduct.quantite - currentQtyInCart;

    if (qty > availableStock) {
      setMessage({
        type: "error",
        text: `Stock insuffisant. Seules ${availableStock} unités sont encore disponibles.`,
      });
      return;
    }

    const reduction =
      typeVente === "abonne" && selectedAbonne?.entreprise
        ? selectedAbonne.entreprise.pourcentage_reduction
        : 0;
    const prixUnitaire = Math.round(
      selectedProduct.prix_vente * (1 - reduction / 100),
    );

    if (existingInCart) {
      setCartItems(
        cartItems.map((item) =>
          item.id_produit === selectedProduct.id
            ? {
                ...item,
                quantite: item.quantite + qty,
                total: (item.quantite + qty) * item.prix_unitaire,
              }
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
          prix_unitaire: prixUnitaire,
          prix_original: selectedProduct.prix_vente,
          total: qty * prixUnitaire,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantite(1);
    setProductSearch("");
    setMessage({ type: "", text: "" });
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => item.id_produit !== productId));
  };

  const cartGrandTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.total, 0),
    [cartItems],
  );

  // Enregistrement vente
  const venteMutation = useMutation({
    mutationFn: createVente,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["ventes"]);
      setMessage({ type: "success", text: "Vente enregistrée avec succès !" });

      const saleDetails = {
        id: data?.data?.vente?.id || data?.data?.id || Date.now(),
        user_name: user?.name || user?.nom || "Vendeur",
        nom_client: selectedDependant
          ? `${selectedDependant.nom} (${selectedDependant.lien || "Dépendant"} de ${selectedAbonne?.nom})`
          : typeVente === "abonne"
            ? selectedAbonne?.nom
            : nom_client.trim() || "Client ordinaire",
        entreprise_nom:
          typeVente === "abonne"
            ? selectedAbonne?.entreprise?.nom || null
            : null,
        abonne: selectedAbonne ? { nom: selectedAbonne.nom } : null,
        dependant_id: selectedDependantId || null,
        date: new Date(),
        items: cartItems.map((item) => ({
          nom: item.nom,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
        })),
        total: cartGrandTotal,
      };

      setLastSale(saleDetails);
      setCartItems([]);
      setNomClient("");
      setSelectedProductId("");
      setQuantite(1);
      setTypeVente("comptant");
      setSelectedAbonneId("");
      setSelectedDependantId("");
      setProductSearch("");
      setAbonneSearch("");
      setDependantSearch("");

      setTimeout(() => handlePrint(), 300);
    },
    onError: (err) => {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Erreur lors de l'enregistrement de la vente",
      });
    },
  });

  // Mutation pour annuler/supprimer une vente
  const deleteVenteMutation = useMutation({
    mutationFn: (id) => deleteVente(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["ventes"]);
      queryClient.invalidateQueries(["products"]);
      setMessage({
        type: "success",
        text: "Vente annulée et stock réajusté avec succès.",
      });
    },
    onError: (err) => {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Erreur lors de l'annulation de la vente",
      });
    },
  });

  const handleDeleteVente = (id) => {
    if (
      window.confirm(
        `Voulez-vous vraiment annuler la vente #${id} ? Le stock des produits sera réajusté.`,
      )
    ) {
      deleteVenteMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setMessage({
        type: "error",
        text: "Veuillez ajouter au moins un produit au panier.",
      });
      return;
    }
    if (typeVente === "abonne" && !selectedAbonneId) {
      setMessage({ type: "error", text: "Veuillez sélectionner un abonné." });
      return;
    }

    venteMutation.mutate({
      items: cartItems.map((item) => ({
        id_produit: item.id_produit,
        quantite: item.quantite,
      })),
      nom_client: selectedDependant
        ? `${selectedDependant.nom} (${selectedDependant.lien || "Dépendant"} de ${selectedAbonne?.nom})`
        : typeVente === "abonne"
          ? selectedAbonne?.nom
          : nom_client.trim() || "Client ordinaire",
      type_vente: typeVente,
      abonne_id: typeVente === "abonne" ? selectedAbonne?.id : null,
      dependant_id:
        typeVente === "abonne" && selectedDependantId
          ? parseInt(selectedDependantId, 10)
          : null,
      user_id: user.id,
    });
  };

  const handleReprint = (vente) => {
    const saleDetails = {
      id: vente.id,
      user_name: vente.vendeur?.name || vente.User?.name || "Vendeur",
      nom_client: vente.nom_client || "Client ordinaire",
      entreprise_nom: vente.abonne?.entreprise?.nom || null,
      abonne: vente.abonne ? { nom: vente.abonne.nom } : null,
      dependant_id: vente.dependant_id,
      date: vente.dateMiseAJour || vente.createdAt || vente.dateVente,
      items:
        vente.items?.length > 0
          ? vente.items.map((vi) => ({
              nom: vi.produit?.nom || "Produit",
              quantite: vi.quantite,
              prix_unitaire: vi.prix_unitaire,
            }))
          : [
              {
                nom: vente.Product?.nom || "Produit",
                quantite: vente.quantite,
                prix_unitaire:
                  vente.Product?.prix_vente ||
                  vente.total / vente.quantite ||
                  0,
              },
            ],
      total: vente.total || (vente.Product?.prix_vente || 0) * vente.quantite,
    };

    setLastSale(saleDetails);
    setTimeout(() => handlePrint(), 200);
  };

  // Filtrage des transactions globales
  const filteredVentes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return ventes.filter((vente) => {
      const clientName = (vente.nom_client || "").toLowerCase();
      const userName = (
        vente.vendeur?.name ||
        vente.User?.name ||
        ""
      ).toLowerCase();
      const idStr = vente.id?.toString() || "";
      return (
        clientName.includes(query) ||
        userName.includes(query) ||
        idStr.includes(query)
      );
    });
  }, [ventes, searchTerm]);

  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVentes = filteredVentes.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getReductionForVente = (vente) => {
    if (!vente || vente.type_vente !== "abonne") return 0;
    return vente.abonne?.entreprise?.pourcentage_reduction || 0;
  };

  const openAddModal = (vente) => {
    setSelectedVente(vente);
    setAddCartItems([]);
    setAddProductId("");
    setAddQuantite(1);
    setAddProductSearch("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedVente(null);
    setAddCartItems([]);
    setAddProductSearch("");
  };

  const handleAddToAddCart = () => {
    if (!addProductSelected) return;
    const qty = parseInt(addQuantite);
    if (isNaN(qty) || qty <= 0) return;

    const existing = addCartItems.find(
      (item) => item.id_produit === addProductSelected.id,
    );
    const currentQtyInCart = existing ? existing.quantite : 0;
    const availableStock = addProductSelected.quantite - currentQtyInCart;

    if (qty > availableStock) {
      setMessage({
        type: "error",
        text: `Stock insuffisant. Seules ${availableStock} unités sont encore disponibles.`,
      });
      return;
    }

    const reduction = getReductionForVente(selectedVente);
    const prixUnitaire = Math.round(
      addProductSelected.prix_vente * (1 - reduction / 100),
    );

    if (existing) {
      setAddCartItems(
        addCartItems.map((item) =>
          item.id_produit === addProductSelected.id
            ? {
                ...item,
                quantite: item.quantite + qty,
                total: (item.quantite + qty) * item.prix_unitaire,
              }
            : item,
        ),
      );
    } else {
      setAddCartItems([
        ...addCartItems,
        {
          id_produit: addProductSelected.id,
          nom: addProductSelected.nom,
          quantite: qty,
          prix_unitaire: prixUnitaire,
          prix_original: addProductSelected.prix_vente,
          total: qty * prixUnitaire,
        },
      ]);
    }

    setAddProductId("");
    setAddQuantite(1);
    setAddProductSearch("");
  };

  const handleRemoveFromAddCart = (productId) => {
    setAddCartItems(
      addCartItems.filter((item) => item.id_produit !== productId),
    );
  };

  const addCartTotal = useMemo(
    () => addCartItems.reduce((acc, item) => acc + item.total, 0),
    [addCartItems],
  );

  const addItemsMutation = useMutation({
    mutationFn: ({ venteId, payload }) => addItemsToVente(venteId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["ventes"]);
      queryClient.invalidateQueries(["products"]);
      setMessage({
        type: "success",
        text: "Article(s) ajouté(s) à la facture avec succès !",
      });

      const venteMiseAJour = data?.data?.vente;

      if (venteMiseAJour) {
        const saleDetails = {
          id: venteMiseAJour.id,
          user_name:
            venteMiseAJour.vendeur?.name ||
            venteMiseAJour.User?.name ||
            "Vendeur",
          nom_client: venteMiseAJour.nom_client || "Client ordinaire",
          entreprise_nom: venteMiseAJour.abonne?.entreprise?.nom || null,
          abonne: venteMiseAJour.abonne
            ? { nom: venteMiseAJour.abonne.nom }
            : null,
          dependant_id: venteMiseAJour.dependant_id,
          date: venteMiseAJour.dateVente || venteMiseAJour.createdAt,
          items:
            venteMiseAJour.items?.map((vi) => ({
              nom: vi.produit?.nom || "Produit",
              quantite: vi.quantite,
              prix_unitaire: vi.prix_unitaire,
            })) || [],
          total: venteMiseAJour.total,
        };

        setLastSale(saleDetails);
        setTimeout(() => handlePrint(), 300);
      }

      closeAddModal();
    },
    onError: (err) => {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Erreur lors de l'ajout à la facture",
      });
    },
  });

  const handleSubmitAddItems = (e) => {
    e.preventDefault();
    if (!selectedVente || addCartItems.length === 0) return;

    addItemsMutation.mutate({
      venteId: selectedVente.id,
      payload: {
        items: addCartItems.map((item) => ({
          id_produit: item.id_produit,
          quantite: item.quantite,
        })),
      },
    });
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Caisse / Nouvelle Vente
          </h1>
          <p className="text-sm text-slate-500">
            Enregistrez les sorties de médicaments en direct
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSale && (
            <button
              onClick={() => handlePrint()}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Dernier reçu (#{lastSale.id})
            </button>
          )}
          <button
            onClick={() => navigate("/rapports-ventes")}
            className="flex items-center gap-2 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Voir Rapports Détaillés
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Formulaire & Panier */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-teal-600" /> Saisie de la
              Vente
            </h2>

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

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Type de vente
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTypeVente("comptant");
                      setSelectedAbonneId("");
                      setSelectedDependantId("");
                      setAbonneSearch("");
                      setDependantSearch("");
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      typeVente === "comptant"
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Comptant
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeVente("abonne")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      typeVente === "abonne"
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Abonné
                  </button>
                </div>
              </div>

              {typeVente === "abonne" && (
                <div className="space-y-3">
                  <div className="relative" ref={abonneDropdownRef}>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Abonné
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setIsAbonneDropdownOpen(!isAbonneDropdownOpen)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
                    >
                      <span
                        className={
                          selectedAbonne
                            ? "text-slate-900 font-medium capitalize"
                            : "text-slate-400"
                        }
                      >
                        {selectedAbonne
                          ? `${selectedAbonne.nom} ${selectedAbonne.entreprise ? `(-${selectedAbonne.entreprise.pourcentage_reduction}% via ${selectedAbonne.entreprise.nom})` : "(sans réduction)"}`
                          : "-- Choisir un abonné --"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {isAbonneDropdownOpen && (
                      <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Rechercher un abonné..."
                            value={abonneSearch}
                            onChange={(e) => setAbonneSearch(e.target.value)}
                            autoFocus
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                          />
                        </div>

                        <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                          {filteredAbonnes.length === 0 ? (
                            <div className="py-3 text-center text-xs text-slate-400">
                              Aucun abonné trouvé
                            </div>
                          ) : (
                            filteredAbonnes.map((a) => {
                              const isSelected =
                                parseInt(selectedAbonneId, 10) === a.id;
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAbonneId(a.id.toString());
                                    setSelectedDependantId("");
                                    setDependantSearch("");
                                    setIsAbonneDropdownOpen(false);
                                    setAbonneSearch("");
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-teal-50 text-teal-700 font-semibold"
                                      : "hover:bg-slate-50 text-slate-700"
                                  }`}
                                >
                                  <span className="capitalize">
                                    {a.nom}{" "}
                                    {a.entreprise
                                      ? `(-${a.entreprise.pourcentage_reduction}% via ${a.entreprise.nom})`
                                      : ""}
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

                    {selectedAbonne &&
                      (selectedAbonne.entreprise ? (
                        <p className="text-[10px] text-teal-600 font-semibold mt-1.5 flex items-center gap-1">
                          <Percent className="w-3 h-3" /> Réduction de{" "}
                          {selectedAbonne.entreprise.pourcentage_reduction}% (
                          {selectedAbonne.entreprise.nom}) appliquée
                          automatiquement
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Cet abonné n'a pas
                          d'entreprise associée : aucune réduction appliquée
                        </p>
                      ))}
                  </div>

                  {selectedAbonne &&
                    selectedAbonne.dependants &&
                    selectedAbonne.dependants.length > 0 && (
                      <div className="relative" ref={dependantDropdownRef}>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Bénéficiaire (Optionnel)
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setIsDependantDropdownOpen(!isDependantDropdownOpen)
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
                        >
                          <span
                            className={
                              selectedDependant
                                ? "text-slate-900 font-medium capitalize"
                                : "text-slate-400"
                            }
                          >
                            {selectedDependant
                              ? `${selectedDependant.nom} (${selectedDependant.lien || "Dépendant"})`
                              : "-- C'est l'abonné principal --"}
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>

                        {isDependantDropdownOpen && (
                          <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Rechercher un bénéficiaire..."
                                value={dependantSearch}
                                onChange={(e) =>
                                  setDependantSearch(e.target.value)
                                }
                                autoFocus
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                              />
                            </div>

                            <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDependantId("");
                                  setIsDependantDropdownOpen(false);
                                  setDependantSearch("");
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  !selectedDependantId
                                    ? "bg-teal-50 text-teal-700 font-semibold"
                                    : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <span>-- C'est l'abonné principal --</span>
                                {!selectedDependantId && (
                                  <Check className="w-3.5 h-3.5 text-teal-600" />
                                )}
                              </button>

                              {filteredDependants.length === 0 ? (
                                <div className="py-3 text-center text-xs text-slate-400">
                                  Aucun bénéficiaire trouvé
                                </div>
                              ) : (
                                filteredDependants.map((dep) => {
                                  const isSelected =
                                    parseInt(selectedDependantId, 10) ===
                                    dep.id;
                                  return (
                                    <button
                                      key={dep.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedDependantId(
                                          dep.id.toString(),
                                        );
                                        setIsDependantDropdownOpen(false);
                                        setDependantSearch("");
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                        isSelected
                                          ? "bg-teal-50 text-teal-700 font-semibold"
                                          : "hover:bg-slate-50 text-slate-700"
                                      }`}
                                    >
                                      <span className="capitalize">
                                        {dep.nom} ({dep.lien || "Dépendant"})
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
                    )}
                </div>
              )}

              {/* Select dynamique avec recherche intégrée (Panier Principal) */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Médicament
                </label>

                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
                >
                  <span
                    className={
                      selectedProduct
                        ? "text-slate-900 font-medium capitalize"
                        : "text-slate-400"
                    }
                  >
                    {selectedProduct
                      ? (() => {
                          const inCart =
                            cartItems.find(
                              (item) => item.id_produit === selectedProduct.id,
                            )?.quantite || 0;
                          const realStock = selectedProduct.quantite - inCart;
                          return `${selectedProduct.nom} (Stock : ${realStock}) - ${selectedProduct.prix_vente} FC`;
                        })()
                      : "-- Choisir --"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
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

                    <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                      {filteredProducts.length === 0 ? (
                        <div className="py-3 text-center text-xs text-slate-400">
                          Aucun médicament trouvé
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const inCart =
                            cartItems.find((item) => item.id_produit === p.id)
                              ?.quantite || 0;
                          const realStock = p.quantite - inCart;
                          const isSelected =
                            parseInt(selectedProductId, 10) === p.id;
                          const isDisabled = realStock <= 0;

                          return (
                            <button
                              key={p.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (!isDisabled) {
                                  setSelectedProductId(p.id.toString());
                                  setIsDropdownOpen(false);
                                  setProductSearch("");
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                isDisabled
                                  ? "opacity-40 cursor-not-allowed bg-slate-50"
                                  : isSelected
                                    ? "bg-teal-50 text-teal-700 font-semibold cursor-pointer"
                                    : "hover:bg-slate-50 text-slate-700 cursor-pointer"
                              }`}
                            >
                              <span className="capitalize">{p.nom}</span>
                              <div className="flex items-center gap-2 text-slate-400">
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                                  Stock : {realStock} | {p.prix_vente} FC
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantité
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    selectedProduct
                      ? selectedProduct.quantite -
                        (cartItems.find(
                          (item) => item.id_produit === selectedProduct.id,
                        )?.quantite || 0)
                      : 1
                  }
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedProductId}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter au panier
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Panier */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-teal-600" /> Panier
              </span>
              <span className="text-teal-600 font-extrabold">
                {cartItems.length} article(s)
              </span>
            </h3>

            {cartItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Panier vide
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.id_produit}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">
                        {item.nom}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        {item.quantite} x {item.prix_unitaire.toLocaleString()}{" "}
                        FC
                        {item.prix_original &&
                          item.prix_original !== item.prix_unitaire && (
                            <span className="line-through text-slate-400">
                              {item.prix_original.toLocaleString()} FC
                            </span>
                          )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-800">
                        {item.total.toLocaleString()} FC
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(item.id_produit)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {typeVente === "comptant" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nom du Client (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    value={nom_client}
                    onChange={(e) => setNomClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              )}

              <div className="pt-1 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Grand Total :
                </p>
                <p className="text-xl font-black text-teal-600">
                  {cartGrandTotal.toLocaleString()} FC
                </p>
              </div>

              <button
                type="submit"
                disabled={venteMutation.isLoading || cartItems.length === 0}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                {venteMutation.isLoading
                  ? "Validation..."
                  : "Valider & Imprimer"}
              </button>
            </form>
          </div>
        </div>

        {/* Tableau Récapitulatif des Ventes Globale */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-base font-bold text-slate-900">
                Ventes Recentes (Consolidées)
              </h2>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par client ou vendeur..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Date et Heure</th>
                    <th className="py-3 px-6">Nom du Client</th>
                    <th className="py-3 px-6">Vendu par</th>
                    <th className="py-3 px-6 text-right">Total Vente</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentVentes.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-slate-400 text-sm"
                      >
                        Aucune vente trouvée.
                      </td>
                    </tr>
                  ) : (
                    currentVentes.map((vente) => {
                      const dateObj = new Date(
                        vente.createdAt || vente.dateVente,
                      );
                      const totalV =
                        vente.total ||
                        (vente.Product?.prix_vente || 0) * vente.quantite;

                      return (
                        <tr key={vente.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-6 text-slate-700 font-medium">
                            {dateObj.toLocaleDateString("fr-FR")} à{" "}
                            {dateObj.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3.5 px-6 font-semibold text-slate-900 capitalize">
                            {vente.nom_client || "Client ordinaire"}
                            {vente.type_vente === "abonne" && (
                              <span className="ml-2 inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg text-[10px] font-bold align-middle">
                                <UserCheck className="w-3 h-3" /> Abonné
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-6 text-slate-600 capitalize">
                            {vente.vendeur?.name || vente.User?.name || "N/A"}
                          </td>
                          <td className="py-3.5 px-6 text-right font-black text-teal-600">
                            {totalV.toLocaleString()} FC
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openAddModal(vente)}
                                className="text-slate-400 hover:text-teal-600 transition-colors p-1 cursor-pointer"
                                title="Ajouter un produit à cette facture"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReprint(vente)}
                                className="text-slate-400 hover:text-teal-600 transition-colors p-1 cursor-pointer"
                                title="Réimprimer la facture"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              {user?.role === "admin" && (
                                <button
                                  onClick={() => handleDeleteVente(vente.id)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                  title="Annuler la vente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredVentes.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Affichage de{" "}
                <span className="font-semibold">{startIndex + 1}</span> à{" "}
                <span className="font-semibold">
                  {Math.min(startIndex + itemsPerPage, filteredVentes.length)}
                </span>{" "}
                sur{" "}
                <span className="font-semibold">{filteredVentes.length}</span>{" "}
                résultats
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
      </div>

      {showAddModal && selectedVente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeAddModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-1">
              Ajouter un produit à la facture #{selectedVente.id}
            </h2>
            <p className="text-xs text-slate-500 mb-1 capitalize">
              Client : {selectedVente.nom_client || "Client ordinaire"}
            </p>

            {selectedVente.type_vente === "abonne" &&
              (getReductionForVente(selectedVente) > 0 ? (
                <p className="text-[11px] text-teal-600 font-semibold mb-4 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  Réduction de {getReductionForVente(selectedVente)}% (
                  {selectedVente.abonne?.entreprise?.nom}) appliquée
                  automatiquement
                </p>
              ) : (
                <p className="text-[11px] text-amber-600 font-semibold mb-4 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Abonné sans entreprise associée : aucune réduction
                </p>
              ))}

            <div className="space-y-3">
              <div className="relative" ref={addDropdownRef}>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Médicament
                </label>

                <button
                  type="button"
                  onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
                >
                  <span
                    className={
                      addProductSelected
                        ? "text-slate-900 font-medium capitalize"
                        : "text-slate-400"
                    }
                  >
                    {addProductSelected
                      ? (() => {
                          const inCart =
                            addCartItems.find(
                              (item) =>
                                item.id_produit === addProductSelected.id,
                            )?.quantite || 0;
                          const realStock =
                            addProductSelected.quantite - inCart;
                          return `${addProductSelected.nom} (Stock : ${realStock}) - ${addProductSelected.prix_vente} FC`;
                        })()
                      : "-- Choisir --"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isAddDropdownOpen && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-60 flex flex-col gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Rechercher un médicament..."
                        value={addEspecialmenteSearch}
                        onChange={(e) => setAddProductSearch(e.target.value)}
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                      />
                    </div>

                    <div className="overflow-y-auto max-h-40 divide-y divide-slate-50">
                      {filteredAddProducts.length === 0 ? (
                        <div className="py-3 text-center text-xs text-slate-400">
                          Aucun médicament trouvé
                        </div>
                      ) : (
                        filteredAddProducts.map((p) => {
                          const inCart =
                            addCartItems.find(
                              (item) => item.id_produit === p.id,
                            )?.quantite || 0;
                          const realStock = p.quantite - inCart;
                          const isSelected =
                            parseInt(addProductId, 10) === p.id;
                          const isDisabled = realStock <= 0;

                          return (
                            <button
                              key={p.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                if (!isDisabled) {
                                  setAddProductId(p.id.toString());
                                  setIsAddDropdownOpen(false);
                                  setAddProductSearch("");
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                isDisabled
                                  ? "opacity-40 cursor-not-allowed bg-slate-50"
                                  : isSelected
                                    ? "bg-teal-50 text-teal-700 font-semibold cursor-pointer"
                                    : "hover:bg-slate-50 text-slate-700 cursor-pointer"
                              }`}
                            >
                              <span className="capitalize">{p.nom}</span>
                              <div className="flex items-center gap-2 text-slate-400">
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                                  Stock : {realStock} | {p.prix_vente} FC
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantité
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    addProductSelected
                      ? addProductSelected.quantite -
                        (addCartItems.find(
                          (item) => item.id_produit === addProductSelected.id,
                        )?.quantite || 0)
                      : 1
                  }
                  value={addQuantite}
                  onChange={(e) => setAddQuantite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              <button
                type="button"
                onClick={handleAddToAddCart}
                disabled={!addProductId}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter à la liste
              </button>
            </div>

            {addCartItems.length > 0 && (
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
                {addCartItems.map((item) => (
                  <div
                    key={item.id_produit}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">
                        {item.nom}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        {item.quantite} x {item.prix_unitaire.toLocaleString()}{" "}
                        FC
                        {item.prix_original !== item.prix_unitaire && (
                          <span className="line-through text-slate-400">
                            {item.prix_original.toLocaleString()} FC
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-800">
                        {item.total.toLocaleString()} FC
                      </span>
                      <button
                        onClick={() => handleRemoveFromAddCart(item.id_produit)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmitAddItems}
              className="mt-4 pt-3 border-t border-slate-100"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 font-medium">
                  Total à ajouter :
                </p>
                <p className="text-lg font-black text-teal-600">
                  {addCartTotal.toLocaleString()} FC
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  addItemsMutation.isLoading || addCartItems.length === 0
                }
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all text-xs disabled:opacity-50 cursor-pointer"
              >
                {addItemsMutation.isLoading
                  ? "Enregistrement..."
                  : "Confirmer l'ajout à la facture"}
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="hidden">
        <Receipt ref={receiptRef} saleData={lastSale} />
      </div>
    </Layout>
  );
}
