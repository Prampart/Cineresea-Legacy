// Objet métier qui décrit les données utiles d'une séance de cinéma.
export class Screening {
  // Identifiant de la séance, film projeté et salle.
  id: string | undefined; // texte
  movie: string | undefined; // texte
  room: string | undefined; // texte
  // Date de début, capacité maximale et prix unitaire en centimes.
  startsAt: Date = new Date(); // une vraie Date
  capacity: number | undefined; // nombre de places
  price: number | undefined; // Pour les centimes
}