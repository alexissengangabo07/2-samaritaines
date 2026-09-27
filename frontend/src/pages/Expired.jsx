import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { getLicenseStatus } from '../api/license.api';

export default function Expired() {
    const [statut, setStatut] = useState('chargement');

    useEffect(() => {
        getLicenseStatus()
            .then((res) => {
                setStatut(res.data.expire ? 'expire' : 'valide');
            })
            .catch(() => {
                // Si le serveur est injoignable, on affiche quand même le blocage
                // par prudence plutôt que de laisser un écran vide
                setStatut('expire');
            });
    }, []);

    if (statut === 'chargement') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
            </div>
        );
    }

    // Licence encore valide : on ne laisse pas rester sur cette page
    if (statut === 'valide') {
        return <Navigate to="/" replace />;
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
            <div className="max-w-md text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-rose-400" />
                </div>
                <h1 className="text-xl font-bold">Accès expiré</h1>
                <p className="text-sm text-slate-400">
                    La période d'utilisation de cette application est arrivée à son terme.
                    Veuillez contacter l'administrateur pour renouveler l'accès.
                </p>
                <a
                    href="https://wa.me/+243966790824"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                    Contacter le support
                </a>
            </div>
        </div>
    );
}