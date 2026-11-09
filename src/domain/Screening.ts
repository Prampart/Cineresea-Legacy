/*
?tape 1 - Mod?le de la s?ance.
Une s?ance repr?sente un film programm? dans une salle ? une date donn?e. Elle contient les informations
utilis?es par les r?gles de r?servation, surtout la capacit? et le prix par place.
*/


// Entité métier qui porte les informations nécessaires pour programmer une séance.
export class Screening {
  // Identifiant stable, titre projeté et salle où a lieu la séance.
  id: string | undefined; // texte
  movie: string | undefined; // texte
  room: string | undefined; // texte
  // Date de début, capacité maximale et tarif en centimes utilisés par les règles métier.
  startsAt: Date = new Date(); // une vraie Date
  capacity: number | undefined; // nombre de places
  price: number | undefined; // Pour les centimes
}