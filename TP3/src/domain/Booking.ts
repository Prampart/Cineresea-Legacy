// Valeurs autorisées pour les tarifs et l'état d'une réservation.
export type Tariff = "NORMAL" | "STUDENT";
export type BookingStatus = "CONFIRMED" | "CANCELLED";

// Objet métier qui rassemble les informations enregistrées pour une réservation.
export class Booking {

  // Identifiant de la réservation et identifiant de la séance concernée.
  id: string | undefined; // texte
  screeningId: string | undefined; // texte
  // Coordonnées du client et nombre de places demandées.
  email: string | undefined; // texte
  seats: number | undefined; // nombre de places
  // Tarif choisi, montant total en centimes et état courant.
  tariff: Tariff ="NORMAL"; // le type de tarif
  total: number | undefined; // Pour les centimes
  status: BookingStatus | undefined; // le statut de la réservation
  // Date à laquelle l'objet de réservation a été créé.
  createdAt: Date = new Date(); // une vraie Date
}