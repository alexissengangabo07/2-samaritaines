import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEntreprises, createEntreprise, updateEntreprise, deleteEntreprise } from '../api/entreprise.api';
import Layout from '../components/Layout';
import { Building2, Plus, Pencil, Trash2, X, Percent, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Entreprises() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', adresse: '', telephone: '', email: '', contact_principal: '', pourcentage_reduction: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const { data: entreprises = [] } = useQuery({ queryKey: ['entreprises'], queryFn: async () => (await getEntreprises()).data });

  const resetForm = () => setForm({ nom: '', adresse: '', telephone: '', email: '', contact_principal: '', pourcentage_reduction: '' });

  const openCreateModal = () => { setEditing(null); resetForm(); setShowModal(true); };

  const openEditModal = (e) => {
    setEditing(e);
    setForm({
      nom: e.nom,
      adresse: e.adresse || '',
      telephone: e.telephone || '',
      email: e.email || '',
      contact_principal: e.contact_principal || '',
      pourcentage_reduction: e.pourcentage_reduction ?? 0
    });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? updateEntreprise(editing.id, data) : createEntreprise(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['entreprises']);
      queryClient.invalidateQueries(['abonnes']); // la réduction affichée sur les abonnés peut changer
      setMessage({ type: 'success', text: editing ? 'Entreprise mise à jour.' : 'Entreprise créée avec succès.' });
      setShowModal(false);
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.message || "Erreur lors de l'enregistrement." })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEntreprise(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['entreprises']);
      setMessage({ type: 'success', text: 'Entreprise désactivée.' });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la désactivation.' })
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      setMessage({ type: 'error', text: "Le nom de l'entreprise est obligatoire." });
      return;
    }
    const pct = parseFloat(form.pourcentage_reduction);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setMessage({ type: 'error', text: 'Le pourcentage de réduction doit être compris entre 0 et 100.' });
      return;
    }
    saveMutation.mutate({ ...form, pourcentage_reduction: pct });
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Entreprises Partenaires</h1>
          <p className="text-sm text-slate-500">Sociétés qui prennent en charge les achats de leurs employés abonnés</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" /> Nouvelle entreprise
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
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
              <th className="py-3 px-6">Contact</th>
              <th className="py-3 px-6">Téléphone</th>
              <th className="py-3 px-6">Réduction</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {entreprises.length === 0 ? (
              <tr><td colSpan="5" className="py-8 text-center text-slate-400 text-sm">Aucune entreprise enregistrée.</td></tr>
            ) : (
              entreprises.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" /> <span className='uppercase'>{e.nom}</span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">{e.contact_principal || '—'}</td>
                  <td className="py-3.5 px-6 text-slate-600">{e.telephone || '—'}</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-1 rounded-lg text-xs font-bold">
                      <Percent className="w-3 h-3" /> {e.pourcentage_reduction}%
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(e)} className="text-slate-400 hover:text-teal-600 p-1 cursor-pointer" title="Modifier">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(e.id)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer" title="Désactiver">
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
              {editing ? "Modifier l'entreprise" : "Nouvelle entreprise"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nom de l'entreprise</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  % de réduction accordé aux employés
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.pourcentage_reduction}
                  onChange={(e) => setForm({ ...form, pourcentage_reduction: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact principal (optionnel)</label>
                <input
                  type="text"
                  value={form.contact_principal}
                  onChange={(e) => setForm({ ...form, contact_principal: e.target.value })}
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email (optionnel)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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