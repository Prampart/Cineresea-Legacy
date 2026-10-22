export class PaymentGateway {
  pay(): boolean {
    return Math.random() > 0.05;
  }
}