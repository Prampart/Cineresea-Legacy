import { DomainError } from "./DomainError";
import { Screening } from "./Screening";
import { Tariff } from "./Booking";

const MIN_SEATS = 1;
const MAX_SEATS = 6;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

// Calcule le total en centimes, en appliquant le tarif étudiant et la réduction de groupe.
export function calculatePrice(unitPrice: number, seats: number, tariff: Tariff): number {
  let unit = unitPrice;
  if (tariff === "STUDENT") unit = Math.round(unit * 0.7);
  let total = unit * seats;
  if (seats >= 4) total = Math.round(total * 0.9);
  return total;
}