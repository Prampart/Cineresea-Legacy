/*
?tape 4 - Contrat de paiement.
Le portefeuille de paiement abstrait le service externe r?el. Le cas d'usage demande seulement
si le paiement est accept?, sans conna?tre l'impl?mentation concr?te.
*/


// Contrat de paiement qui évite de lier l'application à un fournisseur concret.
export interface PaymentGateway {
  // Tente le débit en centimes et renvoie false si le prestataire refuse le paiement.
  charge(email: string, amountInCents: number): Promise<boolean>;
}