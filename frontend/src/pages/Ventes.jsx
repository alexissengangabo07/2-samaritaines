import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../api/product.api';
import { createVente, getVentes } from '../api/vente.api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { ShoppingBag, CheckCircle2, AlertCircle, Printer, ChevronLeft, ChevronRight, Calendar, Search } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '../components/Receipt';

export default function Ventes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastSale, setLastSale] = useState(null);
  const receiptRef = useRef();
  const reportRef = useRef(); // Référence pour l'impression du tableau global de l'onglet

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [nom_client, setNomClient] = useState(''); // Variable d'état utilisant nom_client
  const [message, setMessage] = useState({ type: '', text: '' });

  // États pour les filtres, la recherche et la pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('journalier');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Vérification du rôle admin
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Récupération des produits et ventes
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: async () => (await getProducts()).data });
  const { data: ventes = [] } = useQuery({ queryKey: ['ventes'], queryFn: async () => (await getVentes()).data });

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));

  // Configuration de l'impression d'une facture unitaire
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Facture_Vente_${lastSale?.id || Date.now()}`,
  });

  // Configuration de l'impression du rapport du tableau filtré
  const handlePrintReport = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Rapport_Ventes_${activeTab}_${new Date().toISOString().split('T')[0]}`,
  });

  // Mutation pour exécuter la vente
  const venteMutation = useMutation({
    mutationFn: createVente,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['ventes']);
      setMessage({ type: 'success', text: 'Vente enregistrée et stock mis à jour !' });

      const saleDetails = {
        id: data?.data?.id || Date.now(),
        user_name: user?.name || user?.nom || 'Vendeur',
        nom_client: nom_client.trim() || 'Client ordinaire', // Utilisation stricte de nom_client
        date: new Date(),
        items: [
          {
            nom: selectedProduct?.nom || 'Produit',
            quantite: parseInt(quantite),
            prix_unitaire: selectedProduct?.prix_vente || 0
          }
        ],
        total: (selectedProduct?.prix_vente || 0) * parseInt(quantite)
      };

      setLastSale(saleDetails);
      setSelectedProductId('');
      setQuantite(1);
      setNomClient('');

      setTimeout(() => {
        handlePrint();
      }, 300);
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la vente' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductId) return;

    venteMutation.mutate({
      id_produit: selectedProductId,
      quantite: parseInt(quantite),
      nom_client: nom_client.trim() || 'Client ordinaire',
      user_id: user.id
    });
  };

  const handleReprint = (vente) => {
    const saleDetails = {
      id: vente.id,
      user_name: vente.User?.name || 'Vendeur',
      nom_client: vente.nom_client || 'Client ordinaire',
      date: vente.dateVente || vente.createdAt,
      items: [
        {
          nom: vente.Product?.nom || 'Produit',
          quantite: vente.quantite,
          prix_unitaire: vente.Product?.prix_vente || (vente.total / vente.quantite) || 0
        }
      ],
      total: vente.total || ((vente.Product?.prix_vente || 0) * vente.quantite)
    };

    setLastSale(saleDetails);
    setTimeout(() => {
      handlePrint();
    }, 200);
  };

  // --- FILTRAGE TEMPOREL ET RECHERCHE DES VENTES ---
  const filteredVentes = useMemo(() => {
    const now = new Date();
    const query = searchTerm.trim().toLowerCase();

    return ventes.filter(vente => {
      // Filtre par barre de recherche (Nom produit, Vendeur ou Client)
      const productName = vente.Product?.nom?.toLowerCase() || '';
      const userName = vente.User?.name?.toLowerCase() || '';
      const clientName = (vente.nom_client || '').toLowerCase();
      const matchesSearch = productName.includes(query) || userName.includes(query) || clientName.includes(query);

      if (!matchesSearch) return false;

      // Filtre temporel
      if (activeTab === 'tout') return true;

      const venteDate = new Date(vente.dateVente || vente.createdAt);

      if (activeTab === 'journalier') {
        return (
          venteDate.getDate() === now.getDate() &&
          venteDate.getMonth() === now.getMonth() &&
          venteDate.getFullYear() === now.getFullYear()
        );
      }

      if (activeTab === 'hebdomadaire') {
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

      if (activeTab === 'mensuel') {
        return (
          venteDate.getMonth() === now.getMonth() &&
          venteDate.getFullYear() === now.getFullYear()
        );
      }

      return true;
    });
  }, [ventes, activeTab, searchTerm]);

  // --- CALCUL DES TOTAUX ---
  const totals = useMemo(() => {
    return filteredVentes.reduce((acc, vente) => {
      const prixAchatU = vente.Product?.prix_achat || 0;
      const prixVenteU = vente.Product?.prix_vente || (vente.total / vente.quantite) || 0;
      const totalV = vente.total || (prixVenteU * vente.quantite);
      const totalA = prixAchatU * vente.quantite;
      const benef = totalV - totalA;

      acc.totalVente += totalV;
      acc.totalBenefice += benef;
      return acc;
    }, { totalVente: 0, totalBenefice: 0 });
  }, [filteredVentes]);

  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVentes = filteredVentes.slice(startIndex, startIndex + itemsPerPage);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Caisse / Nouvelle Vente</h1>
          <p className="text-sm text-slate-500">Enregistrez les sorties de médicaments en direct</p>
        </div>

        {lastSale && (
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimer dernier reçu (#{lastSale.id})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Formulaire de Vente */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-teal-600" />
            Saisie de la Vente
          </h2>

          {message.text && (
            <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Médicament
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                required
              >
                <option value="">-- Choisir --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.quantite <= 0}>
                    {p.nom} (Stock : {p.quantite}) - {p.prix_vente} FC
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                <p><span className="font-semibold text-slate-900">Prix U :</span> {selectedProduct.prix_vente} FC</p>
                <p><span className="font-semibold text-slate-900">Stock :</span> {selectedProduct.quantite}</p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantité
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.quantite || 1}
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                required
              />
            </div>

            {/* Champ nom_client */}
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

            {selectedProduct && (
              <div className="pt-1">
                <p className="text-[10px] text-slate-400 font-medium">Montant Total :</p>
                <p className="text-xl font-black text-teal-600">
                  {(selectedProduct.prix_vente * quantite).toLocaleString()} FC
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={venteMutation.isLoading || !selectedProductId}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {venteMutation.isLoading ? 'Validation...' : 'Valider & Imprimer'}
            </button>
          </form>
        </div>

        {/* Historique des Ventes & Onglets */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 capitalize">
                <Calendar className="w-5 h-5 text-teal-600" />
                Historique des Ventes ({activeTab})
              </h2>

              <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                {/* Barre de recherche */}
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <button
                  onClick={handlePrintReport}
                  disabled={filteredVentes.length === 0}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                  title="Imprimer le rapport de cet onglet"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimer le rapport
                </button>

                {/* Onglets Temporels */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => handleTabChange('journalier')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'journalier' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Journalier
                  </button>
                  <button
                    onClick={() => handleTabChange('hebdomadaire')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'hebdomadaire' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Hebdomadaire
                  </button>
                  <button
                    onClick={() => handleTabChange('mensuel')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'mensuel' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => handleTabChange('tout')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'tout' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Tout
                  </button>
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
                  {currentVentes.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? "9" : "6"} className="py-8 text-center text-slate-400 text-sm">
                        Aucune vente enregistrée pour cette recherche.
                      </td>
                    </tr>
                  ) : (
                    currentVentes.map((vente) => {
                      const prixAchatUnitaire = vente.Product?.prix_achat || 0;
                      const prixVenteUnitaire = vente.Product?.prix_vente || (vente.total / vente.quantite) || 0;
                      const totalVente = vente.total || (prixVenteUnitaire * vente.quantite);
                      const totalAchat = prixAchatUnitaire * vente.quantite;
                      const benefice = totalVente - totalAchat;
                      const client = vente.nom_client || 'Client ordinaire';

                      return (
                        <tr key={vente.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-6 font-semibold text-slate-900 capitalize">
                            {vente.Product?.nom || 'Produit inconnu'}
                          </td>
                          <td className="py-3.5 px-6 text-slate-600 font-bold">
                            {vente.quantite}
                          </td>
                          <td className="py-3.5 px-6 text-slate-700 capitalize font-medium">
                            {client}
                          </td>
                          {isAdmin && (
                            <>
                              <td className="py-3.5 px-6 text-slate-500 font-medium">
                                {prixAchatUnitaire.toLocaleString()} FC
                              </td>
                              <td className="py-3.5 px-6 text-slate-700 font-medium">
                                {prixVenteUnitaire.toLocaleString()} FC
                              </td>
                              <td className="py-3.5 px-6 font-bold text-emerald-600">
                                +{benefice.toLocaleString()} FC
                              </td>
                            </>
                          )}
                          <td className="py-3.5 px-6 text-slate-600 capitalize">
                            {vente.User?.name || 'N/A'}
                          </td>
                          <td className="py-3.5 px-6 text-slate-400 text-xs">
                            {new Date(vente.dateVente || vente.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => handleReprint(vente)}
                              className="text-slate-400 hover:text-teal-600 transition-colors p-1 cursor-pointer"
                              title="Imprimer cette facture"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {filteredVentes.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-sm font-bold text-slate-900">
                      <td colSpan={isAdmin ? "4" : "3"} className="py-3.5 px-6 uppercase text-xs tracking-wider text-slate-600">
                        Total Période ({filteredVentes.length} ventes)
                      </td>
                      {isAdmin ? (
                        <>
                          <td className="py-3.5 px-6 text-slate-700">
                            {totals.totalVente.toLocaleString()} FC
                          </td>
                          <td className="py-3.5 px-6 text-emerald-600">
                            +{totals.totalBenefice.toLocaleString()} FC
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

          {/* Barre de pagination */}
          {filteredVentes.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Affichage de <span className="font-semibold">{startIndex + 1}</span> à <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredVentes.length)}</span> sur <span className="font-semibold">{filteredVentes.length}</span> résultats
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  Page {currentPage} sur {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composants Masqués pour l'impression */}
      <div className="hidden">
        <Receipt ref={receiptRef} saleData={lastSale} />

        {/* Modèle de rapport imprimable pour l'onglet actif */}
        <div ref={reportRef} className="p-8 bg-white text-slate-900 font-sans">
          <h2 className="text-xl font-bold mb-2">Rapport des Ventes - {activeTab.toUpperCase()}</h2>
          <p className="text-xs text-slate-500 mb-6">
            Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <table className="w-full text-left border-collapse border border-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="p-2 border border-slate-200">Produit</th>
                <th className="p-2 border border-slate-200">Quantité</th>
                <th className="p-2 border border-slate-200">Client</th>
                {isAdmin && (
                  <>
                    <th className="p-2 border border-slate-200">P. Vente Total</th>
                    <th className="p-2 border border-slate-200">Bénéfice Total</th>
                  </>
                )}
                <th className="p-2 border border-slate-200">Vendeur</th>
                <th className="p-2 border border-slate-200">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredVentes.map(vente => {
                const prixVenteUnitaire = vente.Product?.prix_vente || (vente.total / vente.quantite) || 0;
                const totalVente = vente.total || (prixVenteUnitaire * vente.quantite);
                const totalAchat = (vente.Product?.prix_achat || 0) * vente.quantite;
                const benefice = totalVente - totalAchat;

                return (
                  <tr key={vente.id} className="border-b border-slate-200">
                    <td className="p-2 border border-slate-200 capitalize">
                      {vente.Product?.nom || 'N/A'}
                    </td>
                    <td className="p-2 border border-slate-200 font-bold">
                      {vente.quantite}
                    </td>
                    <td className="p-2 border border-slate-200 capitalize">
                      {vente.nom_client || 'Client ordinaire'}
                    </td>
                    {isAdmin && (
                      <>
                        <td className="p-2 border border-slate-200">
                          {totalVente.toLocaleString()} FC
                        </td>
                        <td className="p-2 border border-slate-200 font-semibold text-emerald-700">
                          +{benefice.toLocaleString()} FC
                        </td>
                      </>
                    )}
                    <td className="p-2 border border-slate-200 capitalize">
                      {vente.User?.name || 'N/A'}
                    </td>
                    <td className="p-2 border border-slate-200">
                      {new Date(vente.dateVente || vente.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {isAdmin && (
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan="3" className="p-2 border border-slate-200 uppercase">Totaux</td>
                  <td className="p-2 border border-slate-200">{totals.totalVente.toLocaleString()} FC</td>
                  <td className="p-2 border border-slate-200 text-emerald-700">+{totals.totalBenefice.toLocaleString()} FC</td>
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