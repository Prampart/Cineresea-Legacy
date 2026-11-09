/*
?tape 7 - Adaptateur de persistance JSON pour les s?ances.
Les s?ances sont lues depuis un fichier JSON, tout en respectant le m?me contrat que le repository m?moire.
La logique applicative n'est pas touch?e, seule la source de donn?es change.
*/


import fs from "fs";
import { Screening } from "../../domain/Screening";

export type ScreeningRecord = { id: string; movie: string; room: string; startsAt: string; capacity: number; price: number };

export type JsonShape = { screenings: ScreeningRecord[]};

export class JsonFile {
  constructor(private readonly path: string) {}
  read(): ScreeningRecord {
    return JSON.parse(fs.readFileSync(this.path, "utf-8"));
  }
  write(data: Screening): void {
    fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
  }
}