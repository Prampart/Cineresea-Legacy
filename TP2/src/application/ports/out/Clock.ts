// Contrat qui permet au cas d'utilisation de demander l'heure sans connaître sa source.
export interface Clock {
  // Renvoie la date et l'heure actuelles selon l'adaptateur choisi.
  now(): Date;
}
