/*
?tape 4 - Contrat d'?dition d'?v?nements de domaine.
L'application peut notifier d'autres composants d'un changement m?tier sans les coupler directement
? la logique de r?servation.
*/


import { DomainEvent } from "../../../domain/shared/DomainEvent";

export interface EventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
