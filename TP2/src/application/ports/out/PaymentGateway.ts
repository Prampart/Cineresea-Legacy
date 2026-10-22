// Contrat de paiement qui évite de lier l'application à un fournisseur concret.
export interface PaymentGateway {
  // Tente de débiter le client et indique si le paiement a été accepté.
  charge(email: string, amountInCents: number): Promise<boolean>;
}