export type DomainErrorCode = "NOT_FOUND"  | "INVALID"  | "CONFLICT"  | "PAYMENT_REFUSED";

// Erreur métier qui transporte un code stable et un message compréhensible.
export class DomainError extends Error { //extends Error : garde la pile d’appels
  constructor(public readonly code: DomainErrorCode, message: string) { //readonly : déclare la propriété et l’initialise.
    super(message);
    this.name = "DomainError";
  }
}