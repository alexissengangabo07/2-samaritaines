// src/components/Receipt.jsx
import React, { forwardRef } from 'react';

export const Receipt = forwardRef(({ saleData }, ref) => {
  if (!saleData) return null;

  return (
    <div ref={ref} className="p-8 text-slate-800 text-sm font-sans max-w-xs mx-auto print:p-4">
      {/* En-tête de la Pharmacie */}
      <div className="text-center border-b pb-4 mb-4 border-dashed">
        <h2 className="text-lg font-bold uppercase tracking-wider">CLINIQUE 3 SAMARITAINES</h2>
        <p className="text-xs text-slate-500">Facture / Reçu de Caisse</p>
        <p className="text-xs text-slate-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Informations de la vente */}
      <div className="mb-4 text-xs space-y-1">
        <p><span className="font-semibold">N° facture :</span> #{saleData.id || 'N/A'}</p>
        <p><span className="font-semibold">Acheté par :</span> <span className='capitalioze'>{saleData.nom_client || saleData.client_nom || 'Client ordinaire'}</span></p>
      </div>

      {/* Liste des Médicaments / Articles */}
      <table className="w-full text-left text-xs mb-4 border-b pb-4 border-dashed">
        <thead>
          <tr className="border-b text-slate-500">
            <th className="pb-2">Produit</th>
            <th className="pb-2 text-center">Qté</th>
            <th className="pb-2 text-right">P.U</th>
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {saleData.items?.map((item, index) => (
            <tr key={index}>
              <td className="py-1.5 font-medium">{item.nom}</td>
              <td className="py-1.5 text-center">{item.quantite}</td>
              <td className="py-1.5 text-right">{item.prix_unitaire} $</td>
              <td className="py-1.5 text-right">{(item.quantite * item.prix_unitaire).toFixed(2)} $</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Montant Total */}
      <div className="flex justify-between items-center text-base font-bold mb-6 pt-2 border-t">
        <span>TOTAL :</span>
        <span>{saleData.total?.toFixed(2)} $</span>
      </div>

      {/* Pied de page */}
      <div className="text-center text-xs text-slate-500 mt-6 border-t pt-4 border-dashed">
        <p>Merci pour votre confiance !</p>
        <p className="italic">Les médicaments vendus ne sont ni repris ni échangés.</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';