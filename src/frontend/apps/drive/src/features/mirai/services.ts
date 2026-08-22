/**
 * Les services MirAI listés par le menu.
 *
 * ATTENTION — cette liste est un MIROIR. La liste qui fait foi est celle du socle,
 * `apps/socle-owui/base/habillage/loader.js` dans le dépôt d'infrastructure : c'est elle
 * que chargent les autres applications. Deux listes à tenir synchronisées finissent
 * toujours par diverger ; celle-ci n'existe que parce que Drive ne sait pas encore
 * charger le fichier commun du socle. Le jour où l'habillage devient autonome, ce
 * fichier disparaît au profit de lui. Cf. le prompt de portage archivé côté privé.
 *
 * Pour ajouter un service : une ligne ici ET une ligne dans le loader du socle.
 * Un service `enLigne: false` s'affiche en gris et n'est pas cliquable — mieux vaut une
 * mention « bientôt » qu'un lien qui tombe sur une erreur.
 */

export const DOMAINE_MIRAI = "numerique-interieur.com";

/** Le sous-domaine de Drive, et donc la ligne à marquer « vous êtes ici ». */
export const SERVICE_COURANT = "mesfichiers";

export type ServiceMirai = {
  nom: string;
  hote: string;
  quoi: string;
  enLigne: boolean;
};

export const SERVICES_MIRAI: ServiceMirai[] = [
  {
    nom: "Mon portail",
    hote: "monportail",
    quoi: "Recherche dans la messagerie",
    enLigne: true,
  },
  {
    nom: "Mon assistant",
    hote: "monassistant",
    quoi: "Conversation avec un modèle",
    enLigne: true,
  },
  {
    nom: "Mes fichiers",
    hote: "mesfichiers",
    quoi: "Documents partagés",
    enLigne: true,
  },
  {
    nom: "Mes agents",
    hote: "mesagents",
    quoi: "Construction d’agents",
    enLigne: true,
  },
  {
    nom: "Mes collections",
    hote: "mescollections",
    quoi: "Bases documentaires",
    enLigne: true,
  },
  {
    nom: "Mes réunions",
    hote: "mesreunions",
    quoi: "Transcription et analyse",
    enLigne: true,
  },
  {
    nom: "Mes services",
    hote: "messervices",
    quoi: "Traitement de documents",
    enLigne: false,
  },
  {
    nom: "Imagerie",
    hote: "imagerie",
    quoi: "Génération d’images",
    enLigne: false,
  },
  {
    nom: "Mon coffre-fort",
    hote: "monvault",
    quoi: "Identifiants et secrets",
    enLigne: true,
  },
];

/**
 * L'avertissement bêta, repris mot pour mot du socle. Il est affiché DEUX fois et c'est
 * voulu : en infobulle au survol, et dans le panneau. Le survol n'existe pas au doigt ;
 * sans la seconde, la mention « peuvent être effacés » serait invisible sur téléphone.
 */
export const AVERTISSEMENT_BETA =
  "Service en expérimentation, ouvert à un groupe de testeurs. Les conversations et " +
  "les documents déposés peuvent être effacés sans préavis : gardez une copie de ce " +
  "qui compte, et n’y mettez aucune donnée sensible.";

/** Le service sur lequel on se trouve, déduit du sous-domaine. */
export const serviceCourant = (hostname: string): string => {
  const sousDomaine = (hostname.split(".")[0] || "").toLowerCase();
  return SERVICES_MIRAI.some((s) => s.hote === sousDomaine)
    ? sousDomaine
    : SERVICE_COURANT;
};
