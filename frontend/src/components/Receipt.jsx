import React, { forwardRef } from 'react';
import Entete from '../assets/entete.png';

export const Receipt = forwardRef(({ saleData }, ref) => {
  if (!saleData) return null;

  // Extraction sécurisée des données selon la structure Sequelize / API
  const items = saleData.items || [];
  const sellerName = saleData.user_name || 'N/A';
  const customerName = saleData.nom_client || saleData.client_nom || 'Client ordinaire';

  // Formatage de la date (soit la date de la vente venant du backend, soit la date actuelle)
  const rawDate = saleData.createdAt || saleData.date;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const totalAmount = parseFloat(saleData.totalAmount || saleData.total || 0);

  return (
    <div ref={ref} className="p-8 text-slate-800 text-sm font-sans max-w-xs mx-auto print:p-4 print:w-full">
      {/* En-tête de la Pharmacie / Clinique */}
      <div className="text-center border-b pb-4 mb-4 border-dashed border-slate-300">
        <img src={Entete} alt='entete' />
        <p className="text-xs text-slate-500">Facture / Reçu de Caisse</p>
        <p className="text-xs text-slate-500 mt-1">{formattedDate}</p>
      </div>

      {/* Informations de la vente */}
      <div className="mb-4 text-xs space-y-1">
        <p><span className="font-semibold">N° facture :</span> #{saleData.id || 'N/A'}</p>
        <p><span className="font-semibold">Client :</span> <span className="capitalize">{customerName}</span></p>
        {saleData.entreprise_nom && (
          <p><span className="font-semibold">Pris en charge par :</span> <span className="capitalize">{saleData.entreprise_nom}</span></p>
        )}
        {/* <p><span className="font-semibold">Servi par :</span> <span className="capitalize">{sellerName}</span></p> */}
        {saleData.paymentMethod && (
          <p><span className="font-semibold">Paiement :</span> {saleData.paymentMethod}</p>
        )}
      </div>
      {/* Liste des Articles / Médicaments */}
      <table className="w-full text-left text-xs mb-4 border-b pb-4 border-dashed border-slate-300">
        <thead>
          <tr className="border-b text-slate-500">
            <th className="pb-2">Produit</th>
            <th className="pb-2 text-center">Qté</th>
            <th className="pb-2 text-right">P.U</th>
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.length > 0 ? (
            items.map((item, index) => {
              // Extraction des propriétés quelle que soit la source (DetailVente ou objet local)
              const productName = item.Product?.nom || item.nom || item.produit_nom || 'Article';
              const quantity = item.quantity || item.quantite || 0;
              const unitPrice = parseFloat(item.unitPrice || item.prix_unitaire || item.Product?.prix_vente || 0);
              const lineTotal = item.totalPrice ? parseFloat(item.totalPrice) : quantity * unitPrice;

              return (
                <tr key={item.id || index}>
                  <td className="py-1.5 font-medium capitalize">{productName}</td>
                  <td className="py-1.5 text-center">{quantity}</td>
                  <td className="py-1.5 text-right">{unitPrice}</td>
                  <td className="py-1.5 text-right">{lineTotal}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" className="py-2 text-center text-slate-400 italic">
                Aucun article renseigné
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Montant Total */}
      <div className="flex justify-between items-center text-base font-bold mb-6 pt-2 border-t border-slate-200">
        <span>TOTAL :</span>
        <span>{totalAmount.toFixed(2)} FC</span>
      </div>

      {/* Pied de page */}
      <div className="text-center text-xs text-slate-500 mt-6 border-t pt-4 border-dashed border-slate-300">
        <p className="font-medium">Merci pour votre confiance !</p>
        <p className="italic mt-1">Les médicaments vendus ne sont ni repris ni échangés.</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';