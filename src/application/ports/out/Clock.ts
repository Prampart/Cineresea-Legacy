/*
?tape 4 - Contrat de l'horloge.
L'horloge abstrait l'heure syst?me pour que le code m?tier puisse ?tre test? sans d?pendre du temps r?el.
Cela rend les r?gles d'annulation et les dates plus reproductibles.
*/


// Contrat qui permet au cas d'utilisation de demander l'heure sans connaître sa source.
export interface Clock {
  // Fournit l'instant présent; l'abstraction permet de contrôler le temps dans les tests.
  now(): Date;
}
