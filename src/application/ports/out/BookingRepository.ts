/*
?tape 4 - Contrat de persistance des r?servations.
Le cas d'usage ne conna?t ni la base de donn?es ni la m?moire. Il sait seulement qu'il peut chercher,
compter et sauvegarder des r?servations selon ce contrat.
*/


import { Booking } from "../../../domain/Booking";

// Contrat de stockage utilisé par le cas d'utilisation, sans dépendre d'une base concrète.
export interface BookingRepository {
  // Recherche toutes les réservations du client; une liste vide signifie aucun résultat.
  findByEmail(email: string): Promise<Booking[]>;
  // Recherche une réservation unique; undefined signale un identifiant inconnu.
  findById(id: string): Promise<Booking | undefined>;
  // Compte uniquement les places des réservations confirmées pour vérifier la capacité.
  countConfirmedSeats(screeningId: string): Promise<number | undefined>;
  // Crée ou met à jour une réservation sans renvoyer de donnée.
  save(booking: Booking): Promise<void>;
}