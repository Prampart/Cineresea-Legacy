/*
?tape 7 - Adaptateur de g?n?ration UUID.
Le g?n?rateur concret produit un identifiant unique pour chaque r?servation. L'objectif est d'isoler
la strat?gie technique afin que le domaine reste tr?s simple.
*/


// Fonction standard de Node.js qui génère un UUID aléatoire.
import { randomUUID } from "node:crypto";
// Port que l'adaptateur implémente pour rester interchangeable.
import { IdGenerator } from "../../application/ports/out/IdGenerator";

// Adaptateur concret de génération d'identifiants à l'aide de Node.js.
export class UuidGenerator implements IdGenerator {
  // Génère un identifiant pour une réservation sans exposer le mécanisme au use case.
  generate(): string {
    return randomUUID();
  }
}
