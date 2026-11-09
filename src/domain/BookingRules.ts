/*
?tape 2 - R?gles m?tier de validation.
Ici, on centralise les r?gles : email valide, nombre de places autoris?es, s?ance non commenc?e,
places disponibles et conditions d'annulation. Les cas d'usage appellent ces fonctions avant d'?crire quoi que ce soit.
*/


import { DomainError } from "./DomainError";
import { Screening } from "./Screening";
import { Booking, Tariff } from "./Booking";

// Bornes métier appliquées à chaque réservation.
const MIN_SEATS = 1;
const MAX_SEATS = 6;
// Expression régulière utilisée pour refuser les adresses de contact manifestement invalides.
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Délai minimum d'annulation exprimé en millisecondes pour comparer des dates.
const CANCELLATION_DEADLINE_MS = 2 * 60 * 60 * 1000;

// Refuse les adresses vides ou qui ne respectent pas le format attendu.
export function ensureValidEmail(email: string): void {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new DomainError("INVALID", "Email invalide");
  }
}

// Limite chaque réservation à un nombre entier de places compris entre 1 et 6.
export function ensureValidSeatCount(seats: number): void {
  if (!Number.isInteger(seats) || seats < MIN_SEATS || seats > MAX_SEATS) {
    throw new DomainError("INVALID", `Entre ${MIN_SEATS} et ${MAX_SEATS} places par réservation`);
  }
}

// Empêche de réserver une séance dont l'heure de début est déjà passée.
export function ensureNotStarted(screening: Screening, now: Date): void {
  if (screening.startsAt <= now) {
    throw new DomainError("CONFLICT", "La séance a déjà commencé");
  }
}

// Vérifie que les places déjà prises et celles demandées ne dépassent pas la capacité.
export function ensureEnoughSeats(screening: Screening, alreadyTaken: number, requested: number): void {
  if (screening.capacity === undefined || alreadyTaken + requested > screening.capacity) {
    throw new DomainError("CONFLICT", "Plus assez de places");
  }
}

// Vérifie les règles métier d'annulation sans modifier la réservation ni la séance.
// À exactement deux heures du début, l'annulation reste autorisée; en dessous, elle échoue.
export function ensureCanCancelBooking(
  booking: Booking,
  screening: Screening,
  now: Date
): void {
  if (booking.status === "CANCELLED") {
    throw new DomainError("CONFLICT", "Déjà annulée");
  }

  const timeUntilScreening = screening.startsAt.getTime() - now.getTime();
  if (timeUntilScreening < CANCELLATION_DEADLINE_MS) {
    throw new DomainError(
      "CONFLICT",
      "Annulation impossible moins de 2h avant la séance"
    );
  }
}

// Calcule le total en centimes, en appliquant le tarif étudiant et la réduction de groupe.
export function calculatePrice(unitPrice: number, seats: number, tariff: Tariff): number {
  // Tous les calculs monétaires restent en centimes afin d'éviter les fractions de centime.
  let unit = unitPrice;
  if (tariff === "STUDENT") unit = Math.round(unit * 0.7);
  let total = unit * seats;
  if (seats >= 4) total = Math.round(total * 0.9);
  return total;
}