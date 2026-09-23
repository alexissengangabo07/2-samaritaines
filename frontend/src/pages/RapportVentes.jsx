import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVentes } from '../api/vente.api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Printer, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '../components/Receipt';
import Entete from '../assets/entete.png'

export default function RapportVentes() {
    const { user } = useAuth();
    const [lastSale, setLastSale] = useState(null);
    const receiptRef = useRef();
    const reportRef = useRef();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('journalier');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    // Chargement des ventes
    const { data: ventesData = [] } = useQuery({
        queryKey: ['ventes'],
        queryFn: async () => {
            const res = await getVentes();
            return Array.isArray(res.data) ? res.data : (res.data?.ventes || []);
        }
    });

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Facture_Vente_${lastSale?.id || Date.now()}`,
    });

    const handlePrintReport = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Rapport_Ventes_${activeTab}_${new Date().toISOString().split('T')[0]}`,
    });

    // Re-réimpression d'un reçu
    const handleReprint = (vente) => {
        const saleDetails = {
            id: vente.id,
            user_name: vente.vendeur?.name || 'Vendeur',
            nom_client: vente.nom_client || 'Client ordinaire',
            date: vente.dateVente || vente.createdAt,
            items: (vente.items || []).map(item => ({
                nom: item.produit?.nom || 'Produit',
                quantite: item.quantite,
                prix_unitaire: item.prix_unitaire
            })),
            total: vente.total
        };

        setLastSale(saleDetails);
        setTimeout(() => handlePrint(), 200);
    };

    // Filtrage des ventes
    const filteredVentes = useMemo(() => {
        const now = new Date();
        const query = searchTerm.trim().toLowerCase();

        return ventesData.filter(vente => {
            const clientName = (vente.nom_client || '').toLowerCase();
            const vendedorName = (vente.vendeur?.name || '').toLowerCase();
            const hasMatchingProduct = (vente.items || []).some(item =>
                (item.produit?.nom || '').toLowerCase().includes(query)
            );

            const matchesSearch = clientName.includes(query) || vendedorName.includes(query) || hasMatchingProduct;

            if (!matchesSearch) return false;
            if (activeTab === 'tout') return true;

            const venteDate = new Date(vente.dateVente);
            if (isNaN(venteDate.getTime())) return false;

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
    }, [ventesData, activeTab, searchTerm]);

    // Extraction à plat de toutes les lignes d'articles pour la table détaillée
    const flatRows = useMemo(() => {
        const rows = [];
        filteredVentes.forEach(vente => {
            if (vente.items && vente.items.length > 0) {
                vente.items.forEach(item => {
                    const prixAchatU = item.produit?.prix_achat || 0;
                    const prixVenteT = item.total_ligne || (item.quantite * item.prix_unitaire);
                    const beneficeT = prixVenteT - (prixAchatU * item.quantite);

                    rows.push({
                        venteId: vente.id,
                        nom_produit: item.produit?.nom || 'N/A',
                        quantite: item.quantite,
                        nom_client: vente.nom_client || 'Client ordinaire',
                        prix_achat_u: prixAchatU,
                        prix_vente_t: prixVenteT,
                        benefice_t: beneficeT,
                        vendeur_nom: vente.vendeur?.name || 'N/A',
                        dateVente: vente.dateVente,
                        rawVente: vente
                    });
                });
            }
        });
        return rows;
    }, [filteredVentes]);

    // Calculs totaux
    const totals = useMemo(() => {
        return flatRows.reduce((acc, row) => {
            acc.totalVente += row.prix_vente_t;
            acc.totalBenefice += row.benefice_t;
            return acc;
        }, { totalVente: 0, totalBenefice: 0 });
    }, [flatRows]);

    const totalPages = Math.ceil(flatRows.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRows = flatRows.slice(startIndex, startIndex + itemsPerPage);

    return (
        <Layout>
            <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rapports & Détails des Ventes</h1>
                    <p className="text-sm text-slate-500">Historique détaillé par article vendu</p>
                </div>

                <button
                    onClick={handlePrintReport}
                    disabled={flatRows.length === 0}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-40"
                >
                    <Printer className="w-4 h-4" /> Imprimer Rapport ({activeTab})
                </button>
            </div>

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
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                                />
                            </div>

                            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                                {['journalier', 'hebdomadaire', 'mensuel', 'tout'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                                        className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
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
                                        <td colSpan={isAdmin ? "9" : "6"} className="py-8 text-center text-slate-400 text-sm">
                                            Aucun article vendu enregistré pour cette sélection.
                                        </td>
                                    </tr>
                                ) : (
                                    currentRows.map((row, idx) => {
                                        const dateObj = new Date(row.dateVente);

                                        return (
                                            <tr key={`${row.venteId}-${idx}`} className="hover:bg-slate-50/50">
                                                <td className="py-3.5 px-6 font-semibold text-slate-900 capitalize">
                                                    {row.nom_produit}
                                                </td>
                                                <td className="py-3.5 px-6 text-slate-600 font-bold">{row.quantite}</td>
                                                <td className="py-3.5 px-6 text-slate-700 capitalize font-medium">{row.nom_client}</td>
                                                {isAdmin && (
                                                    <>
                                                        <td className="py-3.5 px-6 text-slate-500 font-medium">{row.prix_achat_u.toLocaleString()} FC</td>
                                                        <td className="py-3.5 px-6 text-slate-700 font-medium">{row.prix_vente_t.toLocaleString()} FC</td>
                                                        <td className={`py-3.5 px-6 font-bold ${row.benefice_t > 0
                                                            ? 'text-emerald-600'
                                                            : row.benefice_t < 0
                                                                ? 'text-rose-600'
                                                                : 'text-slate-400'
                                                            }`}>
                                                            {row.benefice_t.toLocaleString()} FC
                                                        </td>
                                                    </>
                                                )}
                                                <td className="py-3.5 px-6 text-slate-600 capitalize">{row.vendeur_nom}</td>
                                                <td className="py-3.5 px-6 text-slate-400 text-xs">
                                                    {!isNaN(dateObj.getTime())
                                                        ? `${dateObj.toLocaleDateString('fr-FR')} ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                                                        : 'N/A'
                                                    }
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
                                        <td colSpan={isAdmin ? "4" : "3"} className="py-3.5 px-6 uppercase text-xs tracking-wider text-slate-600">
                                            Total Période ({flatRows.length} lignes)
                                        </td>
                                        {isAdmin ? (
                                            <>
                                                <td className="py-3.5 px-6 text-slate-700">{totals.totalVente.toLocaleString()} FC</td>
                                                <td className={`py-3.5 px-6 font-bold text-lg ${totals.totalBenefice > 0
                                                    ? 'text-emerald-600'
                                                    : totals.totalBenefice < 0
                                                        ? 'text-rose-600'
                                                        : 'text-slate-400'
                                                    }`}>
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
                            Affichage de <span className="font-semibold">{startIndex + 1}</span> à <span className="font-semibold">{Math.min(startIndex + itemsPerPage, flatRows.length)}</span> sur <span className="font-semibold">{flatRows.length}</span> résultats
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

            {/* Impression masquée */}
            <div className="hidden">
                <Receipt ref={receiptRef} saleData={lastSale} />

                <div ref={reportRef} className="p-8 bg-white text-slate-900 font-sans">
                    <img src={Entete} alt='entete' />
                    <h2 className="text-xl font-bold mb-2">Rapport des Ventes - {activeTab.toUpperCase()}</h2>

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
                                    <td className="p-2 border border-slate-200 capitalize">{row.nom_produit}</td>
                                    <td className="p-2 border border-slate-200 font-bold">{row.quantite}</td>
                                    <td className="p-2 border border-slate-200 capitalize">{row.nom_client}</td>
                                    {isAdmin && (
                                        <>
                                            <td className="p-2 border border-slate-200">{row.prix_achat_u.toLocaleString()} FC</td>
                                            <td className="p-2 border border-slate-200">{row.prix_vente_t.toLocaleString()} FC</td>
                                            <td className={`p-2 border border-slate-200 font-semibold ${row.benefice_t > 0
                                                ? 'text-emerald-600'
                                                : row.benefice_t < 0
                                                    ? 'text-rose-600'
                                                    : 'text-slate-400'
                                                }`}>
                                                {row.benefice_t.toLocaleString()} FC
                                            </td>
                                        </>
                                    )}
                                    <td className="p-2 border border-slate-200 capitalize">{row.vendeur_nom}</td>
                                    <td className="p-2 border border-slate-200">{new Date(row.dateVente).toLocaleDateString('fr-FR')}</td>
                                </tr>
                            ))}
                        </tbody>
                        {isAdmin && (
                            <tfoot>
                                <tr className="bg-slate-100 font-bold">
                                    <td colSpan="4" className="p-2 border border-slate-200 uppercase">Totaux</td>
                                    <td className="p-2 border border-slate-200">{totals.totalVente.toLocaleString()} FC</td>
                                    <td className={`p-2 border border-slate-200 ${totals.totalBenefice > 0
                                        ? 'text-emerald-600'
                                        : totals.totalBenefice < 0
                                            ? 'text-rose-600'
                                            : 'text-slate-400'
                                        }`}>
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