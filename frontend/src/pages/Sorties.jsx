import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios'; // Votre instance configurée d'axios
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  PackageMinus
} from 'lucide-react';

export default function Sorties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // États du formulaire
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [serviceBeneficiaire, setServiceBeneficiaire] = useState('');
  const [motif, setMotif] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Recherche & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Requête Produits
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('/produits');
      return res.data.data || res.data || [];
    }
  });

  // Requête Sorties
  const { data: sortiesData = [] } = useQuery({
    queryKey: ['sorties'],
    queryFn: async () => {
      const res = await axios.get('/sorties');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    }
  });

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId, 10));

  // Ajout d'un produit au panier de sortie
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(quantite, 10);
    if (isNaN(qty) || qty <= 0) return;

    const existingInCart = cartItems.find(item => item.id_produit === selectedProduct.id);
    const currentQtyInCart = existingInCart ? existingInCart.quantite : 0;
    const availableStock = selectedProduct.quantite - currentQtyInCart;

    if (qty > availableStock) {
      setMessage({ type: 'error', text: `Stock insuffisant. ${availableStock} unités disponibles.` });
      return;
    }

    if (existingInCart) {
      setCartItems(cartItems.map(item =>
        item.id_produit === selectedProduct.id
          ? { ...item, quantite: item.quantite + qty }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id_produit: selectedProduct.id,
        nom: selectedProduct.nom,
        quantite: qty
      }]);
    }

    setSelectedProductId('');
    setQuantite(1);
    setMessage({ type: '', text: '' });
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id_produit !== productId));
  };

  // Mutation de validation de la sortie
  const sortieMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axios.post('/sorties', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['sorties']);
      setMessage({ type: 'success', text: 'Sortie de stock enregistrée avec succès !' });

      setCartItems([]);
      setServiceBeneficiaire('');
      setMotif('');
      setSelectedProductId('');
      setQuantite(1);
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la sortie de stock' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez ajouter au moins un produit.' });
      return;
    }
    if (!serviceBeneficiaire.trim()) {
      setMessage({ type: 'error', text: 'Veuillez spécifier le service bénéficiaire.' });
      return;
    }

    sortieMutation.mutate({
      items: cartItems.map(item => ({
        id_produit: item.id_produit,
        quantite: item.quantite
      })),
      service_beneficiaire: serviceBeneficiaire.trim(),
      motif: motif.trim(),
      user_id: user?.id
    });
  };

  // Extraction à plat des lignes de sorties pour la table
  const flatRows = useMemo(() => {
    const rows = [];
    sortiesData.forEach(sortie => {
      if (sortie.items && sortie.items.length > 0) {
        sortie.items.forEach(item => {
          rows.push({
            id: sortie.id,
            nom_produit: item.produit?.nom || 'Inconnu',
            quantite: item.quantite,
            service_beneficiaire: sortie.service_beneficiaire,
            motif: sortie.motif || '-',
            agent: sortie.user?.name || sortie.user?.email || 'Système',
            dateSortie: sortie.createdAt || sortie.dateSortie
          });
        });
      }
    });
    return rows;
  }, [sortiesData]);

  // Filtre de recherche
  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return flatRows.filter(row =>
      row.nom_produit.toLowerCase().includes(query) ||
      row.service_beneficiaire.toLowerCase().includes(query) ||
      row.agent.toLowerCase().includes(query) ||
      row.id.toString().includes(query)
    );
  }, [flatRows, searchTerm]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <PackageMinus className="w-7 h-7 text-amber-600" /> Sortie Interne de Stock
        </h1>
        <p className="text-sm text-slate-500">
          Enregistrez les retraits de produits distribués aux services internes (Urgences, Pédiatrie, etc.)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* COLONNE GAUCHE : FORMULAIRE & PANIER */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-amber-600" /> Formulaire de Sortie
            </h2>

            {message.text && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {message.text}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Produit</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                >
                  <option value="">-- Sélectionner --</option>
                  {products.map((p) => {
                    const inCart = cartItems.find(item => item.id_produit === p.id)?.quantite || 0;
                    const realStock = p.quantite - inCart;
                    return (
                      <option key={p.id} value={p.id} disabled={realStock <= 0}>
                        {p.nom} (Stock : {realStock})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Quantité</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct ? selectedProduct.quantite - (cartItems.find(item => item.id_produit === selectedProduct.id)?.quantite || 0) : 1}
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedProductId}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter à la liste
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Panier des produits */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Articles à sortir</span>
              <span className="text-amber-600 font-extrabold">{cartItems.length}</span>
            </h3>

            {cartItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aucun produit sélectionné
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id_produit} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-900 truncate">{item.nom}</p>
                      <p className="text-[10px] text-slate-500">Qté : {item.quantite}</p>
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.id_produit)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Service Destinataire *</label>
                <input
                  type="text"
                  placeholder="Ex: Pédiatrie, Bloc Opératoire, Maternité"
                  value={serviceBeneficiaire}
                  onChange={(e) => setServiceBeneficiaire(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Motif / Observation</label>
                <textarea
                  placeholder="Ex: Soins d'urgence"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                disabled={sortieMutation.isLoading || cartItems.length === 0}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {sortieMutation.isLoading ? 'Enregistrement...' : 'Valider Le Bon De Sortie'}
              </button>
            </form>
          </div>
        </div>

        {/* COLONNE DROITE : HISTORIQUE DES SORTIES */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-base font-bold text-slate-900">Historique des Sorties Internes</h2>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par produit ou service..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Produit</th>
                    <th className="py-3 px-6">Qté</th>
                    <th className="py-3 px-6">Service Destinataire</th>
                    <th className="py-3 px-6">Motif</th>
                    <th className="py-3 px-6">Enregistré par</th>
                    <th className="py-3 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                        Aucune sortie interne enregistrée.
                      </td>
                    </tr>
                  ) : (
                    currentRows.map((row, idx) => {
                      const dateObj = new Date(row.dateSortie);
                      return (
                        <tr key={`${row.id}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-6 font-semibold text-slate-900 capitalize">{row.nom_produit}</td>
                          <td className="py-3.5 px-6 font-bold text-amber-600">-{row.quantite}</td>
                          <td className="py-3.5 px-6 font-medium text-slate-800 capitalize">{row.service_beneficiaire}</td>
                          <td className="py-3.5 px-6 text-slate-500 text-xs">{row.motif}</td>
                          <td className="py-3.5 px-6 text-slate-600 capitalize">{row.agent}</td>
                          <td className="py-3.5 px-6 text-slate-400 text-xs">
                            {!isNaN(dateObj.getTime())
                              ? `${dateObj.toLocaleDateString('fr-FR')} ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                              : 'N/A'
                            }
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
          {filteredRows.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Affichage de <span className="font-semibold">{startIndex + 1}</span> à <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredRows.length)}</span> sur <span className="font-semibold">{filteredRows.length}</span> résultats
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-700 px-2">Page {currentPage} sur {totalPages || 1}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
    </Layout>
  );
}