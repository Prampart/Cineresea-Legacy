/*
?tape 2 - ?v?nements du domaine.
Un ?v?nement d?crit un fait m?tier qui s'est produit (ex. r?servation confirm?e). Ce m?canisme permet
aux autres composants d'?couter des changements sans coupler fortement les objets entre eux.
*/


// Un domain event décrit un fait métier passé, nommé au passé, immuable
export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
}
