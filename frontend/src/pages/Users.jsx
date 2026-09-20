import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, deleteUser } from '../api/user.api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  Users as UsersIcon, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  ShieldAlert,
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export default function Users() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // États du formulaire
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('AGENT');
  
  // Feedback & Pagination
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Chargement des utilisateurs
  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await getUsers()).data,
    enabled: currentUser?.role === 'admin' // Sécurité frontend
  });

  const users = useMemo(() => {
    if (Array.isArray(usersData)) return usersData;
    return usersData.data || [];
  }, [usersData]);

  // 2. Mutations
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSuccessMsg('Utilisateur créé avec succès !');
      setErrorMsg('');

      // Réinitialisation du formulaire
      setName('');
      setEmail('');
      setPassword('');
      setRole('assistant');
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur');
      setSuccessMsg('');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSuccessMsg('Utilisateur supprimé avec succès.');
      setErrorMsg('');
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la suppression');
      setSuccessMsg('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    createUserMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      role
    });
  };

  const handleDelete = (id) => {
    if (id === currentUser?.id) {
      setErrorMsg('Vous ne pouvez pas supprimer votre propre compte connecté.');
      return;
    }
    if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      deleteUserMutation.mutate(id);
    }
  };

  // Filtrage et pagination
  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter(u => 
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.role?.toLowerCase().includes(query)
    );
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Restriction d'accès si l'utilisateur n'est pas ADMIN
  if (currentUser?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Accès Refusé</h2>
          <p className="text-sm text-slate-500 max-w-md mt-1">
            Cette page est strictement réservée aux administrateurs du système.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <UsersIcon className="w-7 h-7 text-amber-600" /> Gestion des Utilisateurs
        </h1>
        <p className="text-sm text-slate-500">
          Ajoutez de nouveaux comptes et gérez les accès des agents de la pharmacie
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* COLONNE GAUCHE : FORMULAIRE D'AJOUT */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-600" /> Nouvel Utilisateur
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nom complet *
              </label>
              <input
                type="text"
                placeholder="Ex: Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Adresse Email *
              </label>
              <input
                type="email"
                placeholder="jean.dupont@pharm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mot de passe *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rôle *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              >
                <option value="assistant">Assistant (Utilisateur standard)</option>
                <option value="pharmacien">Pharmacien</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createUserMutation.isLoading}
              className="w-full bg-slate-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {createUserMutation.isLoading ? 'Création...' : 'Créer le compte'}
            </button>
          </form>
        </div>

        {/* COLONNE DROITE : LISTE DES UTILISATEURS */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-base font-bold text-slate-900">Liste des Utilisateurs</h2>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email..."
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
                    <th className="py-3 px-6">Nom</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Rôle</th>
                    <th className="py-3 px-6">Date de création</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                        Chargement des utilisateurs...
                      </td>
                    </tr>
                  ) : currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                        Aucun utilisateur trouvé.
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((u) => {
                      const createdDate = new Date(u.createdAt);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-6 font-semibold text-slate-900"><span className='capitalize'>{u.name}</span></td>
                          <td className="py-3.5 px-6 text-slate-600 text-xs">{u.email}</td>
                          <td className="py-3.5 px-6">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'ADMIN' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {u.role || 'assistant'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-slate-400 text-xs">
                            {!isNaN(createdDate.getTime()) ? createdDate.toLocaleDateString('fr-FR') : 'N/A'}
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <button
                              onClick={() => handleDelete(u.id)}
                              disabled={u.id === currentUser?.id}
                              className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title={u.id === currentUser?.id ? "Vous ne pouvez pas vous supprimer" : "Supprimer"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Affichage de <span className="font-semibold">{startIndex + 1}</span> à <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> sur <span className="font-semibold">{filteredUsers.length}</span> résultats
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