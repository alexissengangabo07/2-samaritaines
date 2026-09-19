import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct } from '../api/product.api';
import { getCategories } from '../api/category.api';
import { getFournisseurs } from '../api/fournisseur.api';
import { getUnites } from '../api/unite.api';
import Layout from '../components/Layout';
import {
  Pill, Plus, Search, AlertTriangle, CheckCircle2,
  X, Calendar, Flame, Edit, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Products() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);

  // État de la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix_vente: '',
    quantite: '',
    stock_alerte: '',
    dateExpiration: '',
    id_categorie: '',
    id_fournisseur: '',
    id_unite: ''
  });

  // Chargement des données
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await getProducts()).data
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await getCategories()).data
  });
  const { data: fournisseurs = [] } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: async () => (await getFournisseurs()).data
  });
  const { data: unites = [] } = useQuery({
    queryKey: ['unites'],
    queryFn: async () => (await getUnites()).data
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      closeModal();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la création du produit');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      closeModal();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la modification du produit');
    }
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setErrorMsg('');
    setFormData({
      nom: '',
      description: '',
      prix_vente: '',
      quantite: '',
      stock_alerte: '',
      dateExpiration: '',
      id_categorie: '',
      id_fournisseur: '',
      id_unite: ''
    });
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setErrorMsg('');
    setFormData({
      nom: '',
      description: '',
      prix_vente: '',
      quantite: '',
      stock_alerte: '',
      dateExpiration: '',
      id_categorie: '',
      id_fournisseur: '',
      id_unite: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setErrorMsg('');

    const formatDateForInput = (dateStr) => {
      if (!dateStr || dateStr.startsWith('0000-00-00')) return '';

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';

      return d.toISOString().split('T')[0];
    };

    const formattedDate = formatDateForInput(product.dateExpiration);

    setFormData({
      nom: product.nom || '',
      description: product.description || '',
      prix_vente: product.prix_vente !== undefined ? product.prix_vente : '',
      quantite: product.quantite !== undefined ? product.quantite : '',
      stock_alerte: product.stock_alerte || 5,
      dateExpiration: formattedDate,
      id_categorie: product.categorie_id || product.Category?.id || '',
      id_fournisseur: product.fournisseur_id || product.Fournisseur?.id || '',
      id_unite: product.id_unite || product.Unite?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.nom.trim()) return;

    const nameExists = products.some(
      (p) => p.nom.trim().toLowerCase() === formData.nom.trim().toLowerCase() && p.id !== editingProduct?.id
    );

    if (nameExists) {
      setErrorMsg("Un autre produit avec ce nom existe déjà dans le catalogue.");
      return;
    }

    const payload = {
      nom: formData.nom.trim(),
      description: formData.description ? formData.description.trim() : null,
      prix_vente: parseFloat(formData.prix_vente) || 0,
      quantite: parseInt(formData.quantite, 10) || 0,
      stock_alerte: parseInt(formData.stock_alerte, 10),
      dateExpiration: formData.dateExpiration || null,
      categorie_id: formData.id_categorie ? parseInt(formData.id_categorie, 10) : null,
      fournisseur_id: formData.id_fournisseur ? parseInt(formData.id_fournisseur, 10) : null,
      id_unite: formData.id_unite ? parseInt(formData.id_unite, 10) : null
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  const isExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
    const diffTime = expiryDate.getTime() - today.getTime();
    return diffTime <= ninetyDaysInMs;
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nom?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'low_stock') {
      return p.quantite <= p.stock_alerte;
    }

    if (activeTab === 'expiring') {
      return isExpiringSoon(p.dateExpiration);
    }

    return true;
  });

  // Calculs pour la pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Gestion de la recherche et des filtres
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const lowStockCount = products.filter(p => p.quantite <= p.stock_alerte).length;
  const expiringCount = products.filter(p => isExpiringSoon(p.dateExpiration)).length;
  const isSubmitting = createProductMutation.isLoading || updateProductMutation.isLoading;

  return (
    <Layout>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock des Médicaments</h1>
          <p className="text-sm text-slate-500">Consultez et gérez l'inventaire complet de la pharmacie</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </button>
      </div>

      {/* Barre d'onglets */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'all'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          Tous les médicaments
          <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('expiring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'expiring'
            ? 'bg-rose-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Calendar className="w-4 h-4" />
          Expiration proche (≤ 3 mois)
          {expiringCount > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'expiring' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-700'}`}>
              {expiringCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('low_stock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'low_stock'
            ? 'bg-amber-500 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Flame className="w-4 h-4" />
          Stock faible
          {lowStockCount > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'low_stock' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {lowStockCount}
            </span>
          )}
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6 relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher un médicament..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
      </div>

      {/* Tableau des produits */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Chargement de l'inventaire...</div>
        ) : isError ? (
          <div className="p-12 text-center text-rose-500 text-sm">Erreur lors de la récupération du stock.</div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Produit</th>
                  <th className="py-3.5 px-6">Catégorie</th>
                  <th className="py-3.5 px-6">Prix de Vente</th>
                  <th className="py-3.5 px-6">Quantité</th>
                  <th className="py-3.5 px-6">Expiration</th>
                  <th className="py-3.5 px-6">Fournisseur</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 text-sm">
                      Aucun médicament trouvé pour ce filtre.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    const isLowStock = product.quantite <= product.stock_alerte;
                    const isExpiring = isExpiringSoon(product.dateExpiration);

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="capitalize">{product.nom}</p>
                            {product.description && (
                              <p className="text-xs font-normal text-slate-400 line-clamp-1">{product.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          <span className="capitalize">{product.Category?.nom || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {product.prix_vente?.toLocaleString()} FC
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isLowStock
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            {isLowStock ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {product.quantite}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {product.dateExpiration ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${isExpiring ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold' : 'text-slate-600'
                              }`}>
                              {isExpiring && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              {new Date(product.dateExpiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          {product.Fournisseur?.nom || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            title="Modifier le produit"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-teal-600 transition-colors shadow-sm"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Éditer
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Affichage de <span className="font-bold text-slate-700">{startIndex + 1}</span> à{' '}
                  <span className="font-bold text-slate-700">
                    {Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)}
                  </span>{' '}
                  sur <span className="font-bold text-slate-700">{filteredProducts.length}</span> résultats
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Page précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-bold text-slate-700 px-2">
                    Page {currentPage} sur {totalPages || 1}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Page suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL AJOUT / MODIFICATION PRODUIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Modifier le médicament' : 'Ajouter un nouveau médicament'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="ex: Amoxicilline 500mg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prix de vente (FC) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="prix_vente"
                    value={formData.prix_vente}
                    onChange={handleChange}
                    placeholder="ex: 3500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stock d'alerte *
                  </label>
                  <input
                    type="number"
                    name="stock_alerte"
                    value={formData.stock_alerte}
                    onChange={handleChange}
                    placeholder="ex: 100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Date d'expiration *
                </label>
                <input
                  type="date"
                  name="dateExpiration"
                  value={formData.dateExpiration}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Catégorie *
                  </label>
                  <select
                    name="id_categorie"
                    value={formData.id_categorie}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fournisseur *
                  </label>
                  <select
                    name="id_fournisseur"
                    value={formData.id_fournisseur}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Unité de mesure *
                </label>
                <select
                  name="id_unite"
                  value={formData.id_unite}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  required
                >
                  <option value="">-- Sélectionner l'unité --</option>
                  {unites.map(u => (
                    <option key={u.id} value={u.id}>{u.nom || u.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Informations complémentaires, posologie..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Enregistrement...'
                    : editingProduct ? 'Mettre à jour' : 'Enregistrer le produit'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </Layout>
  );
}