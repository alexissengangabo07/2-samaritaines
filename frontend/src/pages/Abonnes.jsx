// Abonnes.jsx (Mis à jour avec gestion des dépendants)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAbonnes,
  createAbonne,
  updateAbonne,
  deleteAbonne,
} from "../api/abonne.api";
import {
  getDependantsByAbonne,
  createDependant,
  deleteDependant,
} from "../api/dependant.api";
import { getEntreprises } from "../api/entreprise.api";
import Layout from "../components/Layout";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Percent,
  Building2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ShieldAlert,
} from "lucide-react";

export default function Abonnes() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showDependantModal, setShowDependantModal] = useState(false);
  const [editingAbonne, setEditingAbonne] = useState(null);
  const [selectedAbonneForDep, setSelectedAbonneForDep] = useState(null);

  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    adresse: "",
    entreprise_id: "",
  });
  const [depForm, setDepForm] = useState({ nom: "", lien: "", telephone: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  const { data: abonnes = [] } = useQuery({
    queryKey: ["abonnes"],
    queryFn: async () => (await getAbonnes()).data,
  });
  const { data: entreprises = [] } = useQuery({
    queryKey: ["entreprises"],
    queryFn: async () => (await getEntreprises()).data,
  });

  const { data: dependants = [] } = useQuery({
    queryKey: ["dependants", selectedAbonneForDep?.id],
    queryFn: async () =>
      selectedAbonneForDep
        ? (await getDependantsByAbonne(selectedAbonneForDep.id)).data
        : [],
    enabled: !!selectedAbonneForDep,
  });

  const resetForm = () =>
    setForm({ nom: "", telephone: "", adresse: "", entreprise_id: "" });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingAbonne ? updateAbonne(editingAbonne.id, data) : createAbonne(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["abonnes"]);
      setMessage({
        type: "success",
        text: editingAbonne ? "Abonné mis à jour." : "Abonné créé avec succès.",
      });
      setShowModal(false);
    },
    onError: (err) =>
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Erreur.",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAbonne(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["abonnes"]);
      setMessage({ type: "success", text: "Abonné désactivé." });
    },
  });

  const addDependantMutation = useMutation({
    mutationFn: (data) => createDependant(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["dependants", selectedAbonneForDep?.id]);
      queryClient.invalidateQueries(["abonnes"]);
      setMessage({ type: "success", text: "Dépendant ajouté avec succès." });
      setDepForm({ nom: "", lien: "", telephone: "" });
    },
    onError: (err) =>
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Erreur lors de l'ajout du dépendant.",
      }),
  });

  const removeDependantMutation = useMutation({
    mutationFn: (id) => deleteDependant(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["dependants", selectedAbonneForDep?.id]);
      queryClient.invalidateQueries(["abonnes"]);
      setMessage({ type: "success", text: "Dépendant désactivé." });
    },
  });

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestion des Abonnés & Dépendants
          </h1>
          <p className="text-sm text-slate-500">
            Travailleurs abonnés et leurs ayants droit bénéficiant de la
            réduction entreprise
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAbonne(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" /> Nouvel abonné
        </button>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-6">Travailleur / Abonné</th>
              <th className="py-3 px-6">Entreprise & Réduction</th>
              <th className="py-3 px-6">Dépendants enregistrés</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {abonnes.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="py-8 text-center text-slate-400 text-sm"
                >
                  Aucun abonné enregistré.
                </td>
              </tr>
            ) : (
              abonnes.map((abonne) => (
                <tr key={abonne.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />{" "}
                      <span className="capitalize">{abonne.nom}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-normal">
                      {abonne.telephone || "Sans téléphone"}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    {abonne.entreprise ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />{" "}
                          {abonne.entreprise.nom}
                        </span>
                        <span className="block text-xs text-teal-600 font-bold">
                          Réduction : -{abonne.entreprise.pourcentage_reduction}
                          %
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">
                        Individuel (Sans réduction)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {abonne.dependants && abonne.dependants.length > 0 ? (
                        abonne.dependants.map((d) => (
                          <span
                            key={d.id}
                            className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md font-medium"
                          >
                            {d.nom} ({d.lien || "Dépendant"})
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Aucun dépendant
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAbonneForDep(abonne);
                        setShowDependantModal(true);
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Gérer les dépendants
                    </button>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingAbonne(abonne);
                          setForm({
                            nom: abonne.nom,
                            telephone: abonne.telephone || "",
                            adresse: abonne.adresse || "",
                            entreprise_id: abonne.entreprise_id || "",
                          });
                          setShowModal(true);
                        }}
                        className="text-slate-400 hover:text-teal-600 p-1 cursor-pointer"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(abonne.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Désactiver"
                      >
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

      {/* Modal de gestion des dépendants */}
      {showDependantModal && selectedAbonneForDep && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDependantModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Dépendants de {selectedAbonneForDep.nom}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Ces membres bénéficieront du taux de réduction de l'entreprise
              associée.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!depForm.nom.trim()) return;
                addDependantMutation.mutate({
                  abonne_id: selectedAbonneForDep.id,
                  ...depForm,
                });
              }}
              className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6"
            >
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ajouter un dépendant
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={depForm.nom}
                  onChange={(e) =>
                    setDepForm({ ...depForm, nom: e.target.value })
                  }
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Lien (ex: Épouse, Fils)"
                  value={depForm.lien}
                  onChange={(e) =>
                    setDepForm({ ...depForm, lien: e.target.value })
                  }
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-lg text-xs cursor-pointer"
              >
                Ajouter ce dépendant
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Liste des dépendants actuels
              </h3>
              {dependants.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Aucun dépendant enregistré pour cet abonné.
                </p>
              ) : (
                dependants.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {dep.nom}
                      </span>
                      <span className="ml-2 bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {dep.lien || "Dépendant"}
                      </span>
                    </div>
                    <button
                      onClick={() => removeDependantMutation.mutate(dep.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout/modification d'abonnée principale (inchangé) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          {/* ... Formulaire d'abonné principal ... */}
        </div>
      )}
    </Layout>
  );
}
