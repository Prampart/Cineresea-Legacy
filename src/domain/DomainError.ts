/*
?tape 2 - Erreurs m?tier typ?es.
Les erreurs sont cod?es pour que le reste de l'application puisse les transformer en r?ponse HTTP,
par exemple 400 pour un format invalide ou 409 pour un conflit de disponibilit?.
*/


// Codes stables utilisés par la présentation pour transformer une erreur métier en réponse HTTP.
export type DomainErrorCode = "NOT_FOUND"  | "INVALID"  | "CONFLICT"  | "PAYMENT_REFUSED";

// Erreur métier typée: le code sert au traitement et le message explique le cas à l'utilisateur.
export class DomainError extends Error {
  // Étend Error pour conserver le comportement standard des exceptions et leur pile d'appels.
  // Le code en lecture seule empêche sa modification après la création de l'erreur.
  constructor(public readonly code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
  }
}