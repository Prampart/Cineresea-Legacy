/*
?tape 7 - Adaptateur de l'horloge syst?me.
Ce composant donne l'heure du syst?me pour les cas r?els. Il est inject? dans les use cases afin qu'ils
puissent contr?ler le temps sans d?pendre directement de Date.now() dans tout le code.
*/


import { Clock } from "../../application/ports/out/Clock";

export class SystemClock implements Clock {
  // Implémentation de production du port Clock: elle utilise l'horloge du système.
  now(): Date {
    // Crée une nouvelle Date au moment de l'appel pour obtenir l'instant courant.
    return new Date();
  }
}
