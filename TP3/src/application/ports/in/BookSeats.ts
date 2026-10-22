import { Booking, Tariff } from "../../../domain/Booking";

// Données transmises par l'appelant pour demander une réservation de places.
export class BookSeatsCommand {
  screeningId: string | undefined;
  email: string | undefined;
  seats: number | undefined;
  tariff: Tariff = "NORMAL";
}

// Port d'entrée: décrit l'action que l'application permet d'exécuter.
export interface BookSeats {
  // Traite la commande et renvoie la réservation créée de façon asynchrone.
  execute(command: BookSeatsCommand): Promise<Booking>;
}