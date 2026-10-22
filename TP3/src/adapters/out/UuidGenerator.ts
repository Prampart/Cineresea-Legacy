import {randomUUID} from "node:crypto";
import {IdGenerator} from "../../application/ports/out/IdGenerator";

// Adaptateur qui utilise le générateur UUID fourni par Node.js.
export class UuidGenerator implements IdGenerator {
  // Produit un identifiant unique pour une nouvelle réservation.
  generate(): string {
    return randomUUID();
  }
}
