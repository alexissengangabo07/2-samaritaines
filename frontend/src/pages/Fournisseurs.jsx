import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFournisseurs, createFournisseur } from '../api/fournisseur.api';
import Layout from '../components/Layout';
import { Users, Plus, Phone, Mail, MapPin, Store } from 'lucide-react';

export default function Fournisseurs() {
  const queryClient = useQueryClient();
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');

  const { data: fournisseurs = [], isLoading } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: async () => (await getFournisseurs()).data
  });

  const fournisseurMutation = useMutation({
    mutationFn: createFournisseur,
    onSuccess: () => {
      queryClient.invalidateQueries(['fournisseurs']);
      setNom('');
      setTelephone('');
      setEmail('');
      setAdresse('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    fournisseurMutation.mutate({ nom, telephone, email, adresse });
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fournisseurs & Laboratoires</h1>
        <p className="text-sm text-slate-500">Gérez le répertoire de vos partenaires d'approvisionnement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire d'ajout */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Nouveau Fournisseur
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nom / Rayson Sociale</label>
              <input
                type="text"
                placeholder="ex: Labo Pharma RDC"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Téléphone</label>
              <input
                type="text"
                placeholder="+243..."
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                placeholder="contact@labo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Adresse</label>
              <input
                type="text"
                placeholder="Ville, Av. ..."
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <button
              type="submit"
              disabled={fournisseurMutation.isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Enregistrer Fournisseur
            </button>
          </form>
        </div>

        {/* Grille des fournisseurs */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
          {isLoading ? (
            <div className="col-span-2 p-8 text-center text-slate-400 text-sm">Chargement...</div>
          ) : (
            fournisseurs.map((f) => (
              <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <Store />
                <h3 className="font-extrabold text-slate-900 text-base capitalize">{f.nom}</h3>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {f.telephone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {f.telephone}
                    </p>
                  )}
                  {f.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {f.email}
                    </p>
                  )}
                  {f.adresse && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {f.adresse}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}