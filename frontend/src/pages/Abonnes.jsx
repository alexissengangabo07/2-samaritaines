import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAbonnes, createAbonne, updateAbonne, deleteAbonne } from '../api/abonne.api';
import { getEntreprises } from '../api/entreprise.api';
import Layout from '../components/Layout';
import { Users, Plus, Pencil, Trash2, X, Percent, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Abonnes() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingAbonne, setEditingAbonne] = useState(null);
    const [form, setForm] = useState({ nom: '', telephone: '', adresse: '', entreprise_id: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    const { data: abonnes = [] } = useQuery({ queryKey: ['abonnes'], queryFn: async () => (await getAbonnes()).data });
    const { data: entreprises = [] } = useQuery({ queryKey: ['entreprises'], queryFn: async () => (await getEntreprises()).data });

    const resetForm = () => setForm({ nom: '', telephone: '', adresse: '', entreprise_id: '' });

    const openCreateModal = () => {
        setEditingAbonne(null);
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (abonne) => {
        setEditingAbonne(abonne);
        setForm({
            nom: abonne.nom,
            telephone: abonne.telephone || '',
            adresse: abonne.adresse || '',
            entreprise_id: abonne.entreprise_id || ''
        });
        setShowModal(true);
    };

    const saveMutation = useMutation({
        mutationFn: (data) => editingAbonne ? updateAbonne(editingAbonne.id, data) : createAbonne(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['abonnes']);
            setMessage({ type: 'success', text: editingAbonne ? 'Abonné mis à jour.' : 'Abonné créé avec succès.' });
            setShowModal(false);
        },
        onError: (err) => setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de l\'enregistrement.' })
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteAbonne(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['abonnes']);
            setMessage({ type: 'success', text: 'Abonné désactivé.' });
        },
        onError: (err) => setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la désactivation.' })
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.nom.trim()) {
            setMessage({ type: 'error', text: 'Le nom est obligatoire.' });
            return;
        }
        saveMutation.mutate({
            ...form,
            entreprise_id: form.entreprise_id || null
        });
    };

    return (
        <Layout>
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Abonnés</h1>
                    <p className="text-sm text-slate-500">Clients bénéficiant d'une vente à crédit, avec réduction héritée de leur entreprise</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-fit"
                >
                    <Plus className="w-4 h-4" /> Nouvel abonné
                </button>
            </div>

            {message.text && (
                <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-6">Nom</th>
                            <th className="py-3 px-6">Téléphone</th>
                            <th className="py-3 px-6">Entreprise</th>
                            <th className="py-3 px-6">Réduction (via entreprise)</th>
                            <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {abonnes.length === 0 ? (
                            <tr><td colSpan="5" className="py-8 text-center text-slate-400 text-sm">Aucun abonné enregistré.</td></tr>
                        ) : (
                            abonnes.map((abonne) => (
                                <tr key={abonne.id} className="hover:bg-slate-50/50">
                                    <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-teal-600" /> <span className='capitalize'>{abonne.nom}</span>
                                    </td>
                                    <td className="py-3.5 px-6 text-slate-600">{abonne.telephone || '—'}</td>
                                    <td className="py-3.5 px-6 text-slate-600">
                                        {abonne.entreprise ? (
                                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {abonne.entreprise.nom}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">Individuel</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-6">
                                        {abonne.entreprise ? (
                                            <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                <Percent className="w-3 h-3" /> {abonne.entreprise.pourcentage_reduction}%
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic text-xs">Aucune</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(abonne)} className="text-slate-400 hover:text-teal-600 p-1 cursor-pointer" title="Modifier">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteMutation.mutate(abonne.id)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer" title="Désactiver">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-base font-bold text-slate-900 mb-4">
                            {editingAbonne ? "Modifier l'abonné" : "Nouvel abonné"}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nom complet</label>
                                <input
                                    type="text"
                                    value={form.nom}
                                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Téléphone (optionnel)</label>
                                <input
                                    type="text"
                                    value={form.telephone}
                                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Adresse (optionnel)</label>
                                <input
                                    type="text"
                                    value={form.adresse}
                                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Entreprise qui prend en charge (optionnel)
                                </label>
                                <select
                                    value={form.entreprise_id}
                                    onChange={(e) => setForm({ ...form, entreprise_id: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                                >
                                    <option value="">-- Aucune (abonné individuel) --</option>
                                    {entreprises.map((e) => (
                                        <option key={e.id} value={e.id}>{e.nom} (-{e.pourcentage_reduction}%)</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    La réduction appliquée sera automatiquement celle de l'entreprise choisie.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={saveMutation.isLoading}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50 cursor-pointer"
                            >
                                {saveMutation.isLoading ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}