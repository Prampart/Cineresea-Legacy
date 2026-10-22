import fs from "fs";
import path from "path";

const DB_FILE = path.join(__dirname, "..", "..", "data", "db.json");

// Lit le fichier JSON de façon synchrone et le convertit en objet JavaScript.
export function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

// Convertit l'objet en JSON lisible et remplace le contenu du fichier.
export function writeDb(db: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}