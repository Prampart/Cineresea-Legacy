/*
?tape 4 - Contrat de g?n?ration d'identifiants.
Chaque r?servation a besoin d'un identifiant unique. Ce port isole la strat?gie r?elle de g?n?ration,
ex. UUID ou autre, dans un seul endroit.
*/


// Contrat pour obtenir des identifiants sans imposer une méthode de génération particulière.
export interface IdGenerator {
  // Fournit un identifiant unique sans imposer au use case l'algorithme utilisé.
  generate(): string;
}