/*
?tape 7 - Adaptateur de stockage des r?servations en m?moire.
Les r?servations sont stock?es dans un tableau JavaScript. C'est la version la plus simple pour d?marrer,
? des fins de d?monstration et de tests sans d?pendre d'une base de donn?es r?elle.
*/


// Entité manipulée par les use cases et par ce repository.
import { Booking } from "../../domain/Booking";
// Contrat sortant que cet adaptateur concret doit respecter.
import { BookingRepository } from "../../application/ports/out/BookingRepository";

// Adaptateur de stockage simple: les données ne vivent que dans le tableau fourni.
export class InMemoryBookingRepository implements BookingRepository {
  // Le tableau partagé représente l'état du repository; l'argument permet de charger
  // des données initiales et la valeur par défaut crée un stockage vide.
  constructor(private readonly bookings: Booking[] = []) {}

  // Additionne les places des réservations confirmées pour une séance.
  // Le nombre zéro indique qu'aucune place n'est encore prise dans cet adaptateur.
  async countConfirmedSeats(screeningId: string): Promise<number | undefined> {
    // Exclut les réservations d'autres séances et celles qui ont été annulées.
    const confirmedBookings = this.bookings.filter(
      (booking) => booking.screeningId === screeningId && booking.status === "CONFIRMED"
    );
    // Une réservation mal formée sans nombre de places contribue zéro au total.
    return confirmedBookings.reduce((total, booking) => total + (booking.seats || 0), 0);
  }

  // Recherche une réservation par son identifiant; undefined signifie qu'elle est absente.
  async findById(id: string): Promise<Booking | undefined> {
    return this.bookings.find((booking) => booking.id === id);
  }

  // Retourne uniquement les réservations portant exactement l'adresse demandée.
  // Un tableau vide est renvoyé si aucune réservation ne correspond.
  async findByEmail(email: string): Promise<Booking[]> {
    return this.bookings.filter((booking) => booking.email === email);
  }

  // Ajoute une nouvelle réservation ou remplace celle qui porte déjà le même identifiant.
  async save(booking: Booking): Promise<void> {
    // Sans identifiant, le repository ne peut pas déterminer si l'objet est nouveau
    // ni quelle réservation existante il devrait remplacer.
    if (!booking.id) {
      throw new Error("Impossible d'enregistrer une réservation sans identifiant.");
    }

    // Recherche si save concerne une insertion ou la mise à jour d'une réservation.
    const index = this.bookings.findIndex((existing) => existing.id === booking.id);
    if (index === -1) {
      // Aucun identifiant identique: il s'agit d'une nouvelle réservation.
      this.bookings.push(booking);
    } else {
      // Identifiant déjà présent: remplace l'objet pour préserver une seule entrée.
      this.bookings[index] = booking;
    }
  }
}
