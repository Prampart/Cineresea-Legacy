/*
?tape 7 - Bus d'?v?nements en m?moire.
Le bus permet de diffuser les ?v?nements de domaine aux ?couteurs sans d?pendre de Kafka ou d'un autre broker.
C'est une impl?mentation l?g?re qui simule l'?cosyst?me d'?v?nements.
*/


import { EventPublisher } from "../../../application/ports/out/EventPublisher";
import { DomainEvent } from "../../../domain/shared/DomainEvent";

type Handler = (event: any) => Promise<void>;

// Bus synchrone en mémoire. En production : Kafka, RabbitMQ, SNS/SQS… derrière le même port.
export class InMemoryEventBus implements EventPublisher {
  private readonly handlers = new Map<string, Handler[]>();
  readonly published: DomainEvent[] = [];

  subscribe(type: string, handler: Handler): void {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const e of events) {
      this.published.push(e);
      for (const h of this.handlers.get(e.type) ?? []) await h(e);
    }
  }
}
