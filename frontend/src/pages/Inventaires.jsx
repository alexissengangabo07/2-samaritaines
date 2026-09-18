import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventaires, createInventaire, getInventaireById } from '../api/inventaire.api';
import { getProducts } from '../api/product.api';
import Layout from '../components/Layout';
import { ClipboardList, Plus, Search, Eye, CheckCircle2, X, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export default function Inventaires() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedInventaireId, setSelectedInventaireId] = useState(null);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Nombre d'inventaires par page

    // État du formulaire : stocke les quantités comptées { [produitId]: quantiteConstatee }
    const [counts, setCounts] = useState({});
    const [observations, setObservations] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // 1. Chargement de l'historique des inventaires
    const { data: inventaires = [], isLoading, isError } = useQuery({
        queryKey: ['inventaires'],
        queryFn: async () => (await getInventaires()).data
    });

    // 2. Chargement des produits (uniquement lors de la saisie d'un nouvel inventaire)
    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: async () => (await getProducts()).data,
        enabled: isCreateModalOpen
    });

    // 3. Chargement du détail d'un inventaire sélectionné
    const { data: detailInventaire } = useQuery({
        queryKey: ['inventaire-detail', selectedInventaireId],
        queryFn: async () => (await getInventaireById(selectedInventaireId)).data,
        enabled: !!selectedInventaireId
    });

    // Mutation pour sauvegarder l'inventaire
    const createMutation = useMutation({
        mutationFn: createInventaire,
        onSuccess: () => {
            queryClient.invalidateQueries(['inventaires']);
            queryClient.invalidateQueries(['products']);
            closeCreateModal();
        },
        onError: (err) => {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la sauvegarde de l\'inventaire');
        }
    });

    const handleOpenCreateModal = () => {
        setErrorMsg('');
        setObservations('');
        const initialCounts = {};
        products.forEach(p => { initialCounts[p.id] = p.quantite; });
        setCounts(initialCounts);
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setCounts({});
        setObservations('');
        setErrorMsg('');
    };

    const handleCountChange = (productId, val) => {
        setCounts(prev => ({
            ...prev,
            [productId]: parseInt(val, 10) || 0
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg('');
        const token = localStorage.getItem('token');

        if (!token) {
            alert("Aucun token trouvé. Veuillez vous connecter.");
            return;
        }

        const decoded = jwtDecode(token);
        const utilisateur_id = decoded.id;

        const items = products.map(p => ({
            produit_id: p.id,
            quantite_en_stock: p.quantite,
            quantite_constatee: counts[p.id] !== undefined ? counts[p.id] : p.quantite
        }));

        const payload = {
            reference: `INV-${Date.now()}`,
            utilisateur_id,
            observations,
            items
        };

        createMutation.mutate(payload);
    };

    // Fonction pour imprimer le détail de l'inventaire
    const handlePrint = () => {
        if (!detailInventaire) return;

        const printWindow = window.open('', '_blank');
        const dateStr = new Date(detailInventaire.date_inventaire).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const rowsHTML = detailInventaire.items?.map((item) => {
            const ecart = item.quantite_constatee - item.quantite_en_stock;
            const ecartStr = ecart > 0 ? `+${ecart}` : ecart;
            const ecartColor = ecart < 0 ? 'color: #e11d48;' : ecart > 0 ? 'color: #059669;' : 'color: #94a3b8;';

            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;  text-transform: capitalize;">${item.produit?.nom || 'Produit supprimé'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${item.quantite_en_stock}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${item.quantite_constatee}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; ${ecartColor}">${ecartStr}</td>
                </tr>
            `;
        }).join('') || '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Inventaire - ${detailInventaire.reference}</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #1e293b; padding: 20px; }
                    h1 { font-size: 20px; margin-bottom: 5px; }
                    p { font-size: 12px; color: #64748b; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                    th { background-color: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 11px; padding: 10px; border-bottom: 2px solid #e2e8f0; text-align: left; }
                    .observations { margin-top: 20px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>Détail de l'Inventaire : ${detailInventaire.reference}</h1>
                <p>Effectué le ${dateStr} par ${detailInventaire.utilisateur?.name || 'Admin'}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th style="text-align: center;">Stock Théorique</th>
                            <th style="text-align: center;">Stock Compté</th>
                            <th style="text-align: right;">Écart</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
                ${detailInventaire.observations ? `
                    <div class="observations">
                        <strong>Observations :</strong>
                        <p style="margin: 5px 0 0 0; color: #334155;">${detailInventaire.observations}</p>
                    </div>
                ` : ''}
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Filtrage des inventaires
    const filteredInventaires = inventaires.filter(inv =>
        inv.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.utilisateur?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- LOGIQUE DE PAGINATION ---
    const totalPages = Math.ceil(filteredInventaires.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentInventaires = filteredInventaires.slice(startIndex, startIndex + itemsPerPage);

    // Remettre à la page 1 si on recherche quelque chose
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <Layout>
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Historique des Inventaires</h1>
                    <p className="text-sm text-slate-500">Suivez la régularisation et les ajustements de votre stock</p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Réaliser un inventaire
                </button>
            </div>

            {/* Barre de recherche */}
            <div className="mb-6 relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Rechercher par référence..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
            </div>

            {/* Tableau d'historique */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500 text-sm">Chargement de l'historique...</div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-500 text-sm">Erreur lors de la récupération des inventaires.</div>
                ) : (
                    <>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">Référence</th>
                                    <th className="py-3.5 px-6">Date</th>
                                    <th className="py-3.5 px-6">Effectué par</th>
                                    <th className="py-3.5 px-6">Articles comptés</th>
                                    <th className="py-3.5 px-6">Statut</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentInventaires.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                                            Aucun inventaire trouvé.
                                        </td>
                                    </tr>
                                ) : (
                                    currentInventaires.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4 text-teal-600" />
                                                {inv.reference}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 font-medium">
                                                {new Date(inv.date_inventaire).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">
                                                <span className="capitalize">{inv.utilisateur?.name || 'Admin'}</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 font-medium">
                                                {inv.items?.length || 0} référence(s)
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {inv.statut}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => setSelectedInventaireId(inv.id)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-teal-600 transition-colors cursor-pointer"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Barre de pagination */}
                        {filteredInventaires.length > 0 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                <span className="text-xs text-slate-500">
                                    Affichage de <span className="font-semibold">{startIndex + 1}</span> à <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredInventaires.length)}</span> sur <span className="font-semibold">{filteredInventaires.length}</span> résultats
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
                    </>
                )}
            </div>

            {/* MODAL 1 : SAISIE DE L'INVENTAIRE PHYSIQUE */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full p-6 relative max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Nouveau Comptage d'Inventaire</h2>
                            <button onClick={closeCreateModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between space-y-4 pr-1">
                            <div className="space-y-4">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                            <th className="py-2.5 px-3">Produit</th>
                                            <th className="py-2.5 px-3 text-center">En Stock (BDD)</th>
                                            <th className="py-2.5 px-3 text-center">Comptage Réel</th>
                                            <th className="py-2.5 px-3 text-right">Écart</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {products.map((p) => {
                                            const counted = counts[p.id] !== undefined ? counts[p.id] : p.quantite;
                                            const ecart = counted - p.quantite;

                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/50">
                                                    <td className="py-2.5 px-3 font-semibold text-slate-900 capitalize">{p.nom}</td>
                                                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{p.quantite}</td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <input
                                                            type="number"
                                                            value={counted}
                                                            onChange={(e) => handleCountChange(p.id, e.target.value)}
                                                            className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                                                            required
                                                        />
                                                    </td>
                                                    <td className={`py-2.5 px-3 text-right font-bold ${ecart < 0 ? 'text-rose-600' : ecart > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {ecart > 0 ? `+${ecart}` : ecart}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Observations / Remarques
                                    </label>
                                    <textarea
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        rows="2"
                                        placeholder="Raison du contrôle, écarts observés..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-600 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isLoading}
                                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {createMutation.isLoading ? 'Enregistrement...' : 'Valider et Ajuster les Stocks'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2 : CONSULTATION DU DÉTAIL D'UN INVENTAIRE */}
            {selectedInventaireId && detailInventaire && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Détails - {detailInventaire.reference}</h2>
                                <p className="text-xs text-slate-500 capitalize">
                                    Effectué le {new Date(detailInventaire.date_inventaire).toLocaleDateString('fr-FR', {
                                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })} par {detailInventaire.utilisateur?.name || 'Admin'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedInventaireId(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                        <th className="py-2.5 px-3">Produit</th>
                                        <th className="py-2.5 px-3 text-center">Stock Théorique</th>
                                        <th className="py-2.5 px-3 text-center">Stock Compté</th>
                                        <th className="py-2.5 px-3 text-right">Écart</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {detailInventaire.items?.map((item) => {
                                        const ecart = item.quantite_constatee - item.quantite_en_stock;

                                        return (
                                            <tr key={item.id}>
                                                <td className="py-3 px-3 font-semibold text-slate-900"><span className='capitalize'>{item.produit?.nom || 'Produit supprimé'}</span></td>
                                                <td className="py-3 px-3 text-center text-slate-500">{item.quantite_en_stock}</td>
                                                <td className="py-3 px-3 text-center font-bold text-slate-900">{item.quantite_constatee}</td>
                                                <td className={`py-3 px-3 text-right font-bold ${ecart < 0 ? 'text-rose-600' : ecart > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {ecart > 0 ? `+${ecart}` : ecart}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {detailInventaire.observations && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                    <span className="font-bold text-slate-700 block mb-1">Observations :</span>
                                    <p className="text-slate-600">{detailInventaire.observations}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <Printer className="w-4 h-4 text-teal-600" />
                                Imprimer
                            </button>
                            <button
                                onClick={() => setSelectedInventaireId(null)}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}