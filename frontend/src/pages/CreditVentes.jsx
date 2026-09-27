import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVentesCredit, addPaiement } from '../api/vente.api';
import Layout from '../components/Layout';
import { Wallet, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreditVentes() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedVente, setSelectedVente] = useState(null);
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const { data: ventesCredit = [] } = useQuery({
    queryKey: ['ventes-credit'],
    queryFn: async () => (await getVentesCredit()).data
  });

  const openPaiementModal = (vente) => {
    setSelectedVente(vente);
    setMontant('');
    setModePaiement('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVente(null);
  };

  const paiementMutation = useMutation({
    mutationFn: (data) => addPaiement(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ventes-credit']);
      setMessage({ type: 'success', text: 'Paiement enregistré avec succès.' });
      closeModal();
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors du paiement.' })
  });

  const handleSubmitPaiement = (e) => {
    e.preventDefault();
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      setMessage({ type: 'error', text: 'Montant invalide.' });
      return;
    }
    if (montantNum > selectedVente.solde) {
      setMessage({ type: 'error', text: `Le montant dépasse le solde dû (${selectedVente.solde.toLocaleString()} FC).` });
      return;
    }
    paiementMutation.mutate({
      vente_id: selectedVente.id,
      montant: montantNum,
      mode_paiement: modePaiement || undefined
    });
  };

  const statutBadge = (statut) => {
    const styles = {
      non_payé: 'bg-rose-50 text-rose-700 border-rose-200',
      partiel: 'bg-amber-50 text-amber-700 border-amber-200',
      payé: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    const labels = { non_payé: 'Non payé', partiel: 'Partiel', payé: 'Soldé' };
    return <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${styles[statut]}`}>{labels[statut]}</span>;
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ventes à Crédit (Abonnés)</h1>
        <p className="text-sm text-slate-500">Suivi des soldes dus et des paiements reçus</p>
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
              <th className="py-3 px-6">Facture</th>
              <th className="py-3 px-6">Abonné</th>
              <th className="py-3 px-6">Entreprise</th>
              <th className="py-3 px-6 text-right">Total</th>
              <th className="py-3 px-6 text-right">Payé</th>
              <th className="py-3 px-6 text-right">Solde dû</th>
              <th className="py-3 px-6 text-center">Statut</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {ventesCredit.length === 0 ? (
              <tr><td colSpan="8" className="py-8 text-center text-slate-400 text-sm">Aucune vente à crédit.</td></tr>
            ) : (
              ventesCredit.map((vente) => (
                <tr key={vente.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">#{vente.id}</td>
                  <td className="py-3.5 px-6 text-slate-700 capitalize">{vente.abonne?.nom || vente.nom_client}</td>
                  <td className="py-3.5 px-6 text-slate-500">{vente.abonne?.entreprise?.nom || '—'}</td>
                  <td className="py-3.5 px-6 text-right">{vente.total.toLocaleString()} FC</td>
                  <td className="py-3.5 px-6 text-right text-emerald-600 font-semibold">{vente.montant_paye.toLocaleString()} FC</td>
                  <td className="py-3.5 px-6 text-right text-rose-600 font-bold">{vente.solde.toLocaleString()} FC</td>
                  <td className="py-3.5 px-6 text-center">{statutBadge(vente.statut_paiement)}</td>
                  <td className="py-3.5 px-6 text-right">
                    {vente.solde > 0 && (
                      <button
                        onClick={() => openPaiementModal(vente)}
                        className="flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-[11px] font-bold ml-auto cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" /> Encaisser
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && selectedVente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 mb-1">Enregistrer un paiement</h2>
            <p className="text-xs text-slate-500 mb-4">
              Facture #{selectedVente.id} — Solde dû : <span className="font-bold text-rose-600">{selectedVente.solde.toLocaleString()} FC</span>
            </p>

            <form onSubmit={handleSubmitPaiement} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Montant reçu</label>
                <input
                  type="number"
                  min="1"
                  max={selectedVente.solde}
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Mode de paiement (optionnel)</label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="">-- Non précisé --</option>
                  <option value="espece">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="virement">Virement</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={paiementMutation.isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-xs disabled:opacity-50 cursor-pointer"
              >
                {paiementMutation.isLoading ? 'Enregistrement...' : 'Confirmer le paiement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}