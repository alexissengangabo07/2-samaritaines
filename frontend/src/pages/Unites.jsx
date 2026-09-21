import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUnites, createUnite, deleteUnite } from '../api/unite.api';
import Layout from '../components/Layout';
import { Layers, Plus, Search, Trash2, X, Tag } from 'lucide-react';

export default function Unites() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // État du formulaire d'ajout
  const [formData, setFormData] = useState({
    label: '',
    description: ''
  });

  // Récupération des unités depuis le backend
  const { data: unites = [], isLoading, isError } = useQuery({
    queryKey: ['unites'],
    queryFn: async () => (await getUnites()).data
  });

  // Mutation pour créer une unité
  const createUniteMutation = useMutation({
    mutationFn: createUnite,
    onSuccess: () => {
      queryClient.invalidateQueries(['unites']);
      setIsModalOpen(false);
      setErrorMsg('');
      setFormData({ label: '', description: '' });
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || "Erreur lors de la création de l'unité");
    }
  });

  // Mutation pour supprimer une unité
  const deleteUniteMutation = useMutation({
    mutationFn: deleteUnite,
    onSuccess: () => {
      queryClient.invalidateQueries(['unites']);
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.label.trim()) return;
    createUniteMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (confirm('Voulez-vous vraiment supprimer cette unité ?')) {
      deleteUniteMutation.mutate(id);
    }
  };

  const filteredUnites = unites.filter((u) =>
    u.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Unités de mesure</h1>
          <p className="text-sm text-slate-500">Gérez les formes de conditionnement (Boîtes, Flacons, Plaquettes...)</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajouter une unité
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6 relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher une unité..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
      </div>

      {/* Tableau des unités */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden max-w-4xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Chargement des unités...</div>
        ) : isError ? (
          <div className="p-12 text-center text-rose-500 text-sm">Erreur lors de la récupération des données.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Nom de l'unité</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUnites.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-400 text-sm">
                    Aucune unité enregistrée.
                  </td>
                </tr>
              ) : (
                filteredUnites.map((unite) => (
                  <tr key={unite.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <span className='capitalize'>{unite.label}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {unite.description || <span className="text-slate-300 italic">Aucune description</span>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(unite.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL D'AJOUT D'UNITÉ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 relative">
            
            {/* Header du Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Nouvelle Unité de mesure</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMsg('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message d'erreur */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nom de l'unité *
                </label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  autoComplete='off'
                  placeholder="ex: Flacon, Boîte, Plaquette..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Notes explicatives sur l'unité..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createUniteMutation.isLoading}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {createUniteMutation.isLoading ? 'Enregistrement...' : "Créer l'unité"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </Layout>
  );
}