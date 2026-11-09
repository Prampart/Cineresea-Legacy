/*
?tape 3 - Contrat d'entr?e pour consulter ses r?servations.
Cette commande permet ? l'application de filtrer les r?servations d'un client et de renvoyer un format
pr?t ? ?tre affich? par l'API ou une interface.
*/


// Réutilise les propriétés métier d'une réservation dans la réponse du cas d'utilisation.
import { Booking } from "../../../domain/Booking";

// Port entrant: contrat de lecture des réservations appartenant à un client.
export interface ListMyBookings {
  // La commande fournit le critère de recherche; un tableau vide signifie aucun résultat.
  execute(command: ListMyBookingsCommand): Promise<MyBooking[]>;
}

// Objet de saisie qui regroupe les données nécessaires à l'exécution.
export class ListMyBookingsCommand {
  // Cette adresse est utilisée pour filtrer les réservations du client.
  email!: string;
}

// Type de réponse: toutes les propriétés de Booking, plus les informations de séance
// utiles à l'affichage et absentes de l'entité de réservation elle-même.
export type MyBooking = Booking & {
  // Titre du film associé à la réservation via son screeningId.
  movie: string;
  // Date de début, ou null si la séance n'existe plus dans le catalogue.
  startsAt: Date | null;
  // Date enregistrée lors de l'annulation; absente pour une réservation active.
  cancelledAt?: Date;
};

// Forme historique qui regroupe les réservations et deux index d'affichage.
// Elle reste exportée pour ne pas casser les éventuels consommateurs existants.
export type MyBookingsResult = {
  bookings: Booking[];
  // Associe chaque identifiant de film à son titre.
  movies: { [id: string]: string }; // mapping from movie ID to movie title
  // Associe chaque identifiant de séance à son horaire de début.
  startingScreenings: { [id: string]: string }; // mapping from screening ID to starting time
};
