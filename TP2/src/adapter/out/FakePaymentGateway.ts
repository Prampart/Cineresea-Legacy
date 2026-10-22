import { PaymentGateway } from "../../application/ports/out/PaymentGateway";

// Faux service de paiement qui permet de simuler un paiement accepté ou refusé.
export class FakePaymentGateway implements PaymentGateway {
  // Les tests ou le composition root peuvent choisir le résultat du paiement.
  constructor(private forcedResponse = true) {}

  // Définit si le prochain paiement simulé est accepté.
  setResponse(response: boolean): void {
    this.forcedResponse = response;
  }

  // Accepte ou refuse le paiement sans contacter de service externe.
  async charge(_email: string, _amountInCents: number): Promise<boolean> {
    return this.forcedResponse;
  }
}
