// Faux mailer legacy: les messages sont écrits dans la console au lieu d'être envoyés.
export class Mailer {
  // Affiche le récapitulatif d'une réservation confirmée.
  sendBookingConfirmation(
    email: string,
    bookingId: string,
    movie: string,
    seats: number,
    total: number
  ) {
    console.log(
      `[SMTP] To: ${email} — Votre réservation ${bookingId} pour "${movie}" ` +
      `(${seats} place(s), ${(total / 100).toFixed(2)} €) est confirmée.`
    );
  }

  // Affiche l'avis d'annulation et le montant du remboursement.
  sendCancellation(
    email: string,
    bookingId: string,
    total: number
  ) {
    console.log(
      `[SMTP] To: ${email} — Votre réservation ${bookingId} a été annulée. Remboursement : ${(total / 100).toFixed(2)} €`
    );
  }
}