/*
?tape 7 - Adaptateur de persistance JSON pour les r?servations.
Le but est de remplacer le stockage m?moire par un fichier JSON en gardant le m?me contrat applicatif.
Ceci pr?pare la persistance durable sans modifier les use cases.
*/


import fs from "fs";
import { Booking } from "../../domain/Booking";

export type BookingRecord = {
  id: string; screeningId: string; email: string; seats: number; tariff: "NORMAL" | "STUDENT";
  total: number; status: "CONFIRMED" | "CANCELLED"; createdAt: string; cancelledAt?: string;
};

export type JsonShape = { bookings: BookingRecord[] };

export class JsonFile {
  constructor(private readonly path: string) {}
  read(): BookingRecord {
    return JSON.parse(fs.readFileSync(this.path, "utf-8"));
  }
  write(data: Booking): void {
    fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
  }
}