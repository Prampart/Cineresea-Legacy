/*
?tape 3 - Contrat d'entr?e pour lister les s?ances ? venir.
Le port demande la liste des s?ances, mais pas la fa?on de les stocker. Les donn?es sont ensuite enrichies
avec le nombre de places restantes pour l'affichage.
*/


// Réutilise les types du modèle de séance pour garder le contrat aligné avec le domaine.
import { Screening } from "../../../domain/Screening";

// Définit la réponse d'une séance à venir sans exposer sa capacité interne.
// Pick sélectionne les propriétés nécessaires du modèle; le nombre de places est calculé.
export type UpcomingScreening = Pick<
  Screening,
  "id" | "movie" | "room" | "startsAt" | "price"
> & {
  // Places disponibles = capacité de la salle moins les places confirmées.
  remaining: number;
};

// Port entrant: contrat que l'interface utilisateur peut appeler pour obtenir les séances.
export interface ListUpcomingScreenings {
  // Aucun argument n'est requis; Promise reflète les lectures asynchrones des repositories.
  // Le tableau peut être vide si aucune séance n'est programmée dans le futur.
  execute(): Promise<UpcomingScreening[]>;
}
