// Faux paiement legacy qui simule un refus dans environ 5 % des cas.
export class PaymentGateway {
  pay() {
    // Une valeur aléatoire supérieure à 0,05 représente un paiement accepté.
    return Math.random() > 0.05;
  }
}