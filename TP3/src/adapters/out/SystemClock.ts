import { Clock } from "../../application/ports/out/Clock";

export class SystemClock implements Clock {
  // Adaptateur qui fournit l'heure réelle tout en respectant le port Clock.
  now(): Date {
    return new Date(); // Retourne la date et l'heure actuelles.
  }
}
