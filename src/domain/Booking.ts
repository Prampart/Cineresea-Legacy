/*
?tape 1 - Mod?le du m?tier de r?servation.
Cette entit? d?crit ce qu'est une r?servation : qui a r?serv?, pour quelle s?ance, combien de places,
? quel prix et dans quel ?tat. Elle ne sait pas comment elle est sauvegard?e ni comment elle est pay?e.
*/


// Unions fermées: empêchent d'utiliser un tarif ou un statut non prévu par le domaine.
export type Tariff = "NORMAL" | "STUDENT";
export type BookingStatus = "CONFIRMED" | "CANCELLED";

// Entité métier: rassemble les données nécessaires au suivi d'une réservation.
export class Booking {

  // Identifiants permettant de retrouver la réservation et la séance liée.
  id: string | undefined; // texte
  screeningId: string | undefined; // texte
  // Adresse du client et nombre de places retenues par cette réservation.
  email: string | undefined; // texte
  seats: number | undefined; // nombre de places
  // Tarif choisi, montant payé en centimes et état courant du cycle de réservation.
  tariff: Tariff ="NORMAL"; // le type de tarif
  total: number | undefined; // Pour les centimes
  status: BookingStatus | undefined; // le statut de la réservation
  // Horodatage de création, utile à l'historique et au suivi.
  createdAt: Date = new Date(); // une vraie Date
  cancelledAt?: Date; // Date à laquelle la réservation a été annulée; absente tant que la réservation est active.
}