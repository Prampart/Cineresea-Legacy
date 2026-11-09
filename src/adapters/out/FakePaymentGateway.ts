/*
?tape 7 - Adaptateur de paiement simul?.
Le gateway concret ne fait qu'accepter ou refuser un paiement selon une logique de d?monstration.
Il s'agit d'un remplacement simple du vrai syst?me de paiement dans un contexte p?dagogique.
*/


import { PaymentGateway } from "../../application/ports/out/PaymentGateway";

// Faux service de paiement qui permet de simuler un paiement accepté ou refusé.
export class FakePaymentGateway implements PaymentGateway {
  // Stocke le résultat simulé; true accepte le débit, false permet de tester un refus.
  constructor(private forcedResponse = true) {}

  // Change la réponse des appels suivants sans remplacer l'adaptateur injecté.
  setResponse(response: boolean): void {
    this.forcedResponse = response;
  }

  // Ignore volontairement les données de paiement et renvoie le résultat configuré.
  async charge(_email: string, _amountInCents: number): Promise<boolean> {
    return this.forcedResponse;
  }
}
