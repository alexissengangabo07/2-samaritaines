import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory } from '../api/category.api';
import Layout from '../components/Layout';
import { FolderTree, Plus, CheckCircle2 } from 'lucide-react';

export default function Categories() {
  const queryClient = useQueryClient();
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await getCategories()).data
  });

  const categoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setNom('');
      setDescription('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    categoryMutation.mutate({ nom, description });
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Catégories de Produits</h1>
        <p className="text-sm text-slate-500">Organisez vos médicaments par famille d'action ou de forme</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de création */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-teal-600" />
            Nouvelle Catégorie
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nom de la catégorie</label>
              <input
                type="text"
                placeholder="ex: Antibiotiques, Antalgiques..."
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
              <textarea
                placeholder="Courte description de la famille médicale..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 h-24 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={categoryMutation.isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer la catégorie
            </button>
          </form>
        </div>

        {/* Liste des catégories */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Catégories Existantes</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((c) => (
                <div key={c.id} className="p-5 flex items-start justify-between hover:bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-500 capitalize">{c.nom}</h3>
                    {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                    ID: #{c.id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}