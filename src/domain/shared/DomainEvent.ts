/*
?tape 2 - Base commune des ?v?nements de domaine.
Cette interface sert de contrat minimal pour tous les ?v?nements. Elle ?vite d'avoir ? d?pendre
uniquement d'un ?v?nement pr?cis quand on souhaite publier ou enregistrer un changement m?tier.
*/


// Un domain event décrit un fait métier passé, nommé au passé, immuable
export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
}
