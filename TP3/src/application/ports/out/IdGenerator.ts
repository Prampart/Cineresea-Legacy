// Contrat pour obtenir des identifiants sans imposer une méthode de génération particulière.
export interface IdGenerator {
  // Produit un identifiant sous forme de texte.
  generate(): string;
}