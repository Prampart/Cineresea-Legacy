/*
?tape 3 - Contrat d'entr?e pour r?server des places.
La commande d?crit la demande du client : s?ance, email, quantit? et tarif. Le port entrant impose
la signature du cas d'utilisation sans imposer un framework HTTP ou une base de donn?es en particulier.
*/


import { Booking, Tariff } from "../../../domain/Booking";

// Commande: regroupe les données fournies par l'appelant pour créer une réservation.
export class BookSeatsCommand {
  // Séance pour laquelle les places sont demandées; undefined permet de détecter une donnée manquante.
  screeningId: string | undefined;
  // Adresse utilisée pour valider et débiter le client.
  email: string | undefined;
  // Nombre de places demandé; sa validité est vérifiée par les règles métier.
  seats: number | undefined;
  // Tarif NORMAL par défaut, sauf si l'appelant demande un tarif étudiant.
  tariff: Tariff = "NORMAL";
}

// Port entrant: expose le scénario de réservation à la couche de présentation.
export interface BookSeats {
  // Traite la commande de façon asynchrone et renvoie l'entité créée.
  execute(command: BookSeatsCommand): Promise<Booking>;
}