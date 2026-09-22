import { ApiConfig } from "@/features/drivers/types";

/**
 * Le menu des services voisins arrive par la CONFIGURATION, pas par le code.
 *
 * La liste nomme les sous-domaines de tous les services de la plateforme, y compris ceux
 * qui ne sont pas encore ouverts — donc une part de la feuille de route. Ce dépôt est
 * public : elle n'y a pas sa place. Elle est servie par `FRONTEND_MIRAI_SERVICES`, un
 * réglage du backend renseigné au déploiement, aux côtés du fichier d'habillage commun
 * qui fait foi.
 *
 * Réglage absent ou vide : pas de menu. C'est le bon défaut — un menu de services voisins
 * n'a de sens que dans un déploiement qui en a, et mieux vaut rien qu'une liste inventée.
 */

export type ServiceMirai = {
  /** Libellé affiché. */
  name: string;
  /** Sous-domaine, qui sert aussi à reconnaître le service où l'on se trouve. */
  host: string;
  /** Courte description, sous le libellé. */
  about?: string;
  /** Un service hors ligne s'affiche en gris et n'est pas cliquable. Mieux vaut une
   *  mention « bientôt » qu'un lien qui tombe sur une erreur. */
  online?: boolean;
};

export type MenuMirai = {
  /** Domaine commun des services, par exemple `exemple.fr` pour `monservice.exemple.fr`. */
  domain: string;
  /** Sous-domaine de CETTE application, à marquer « vous êtes ici ». */
  current: string;
  /** Avertissement affiché en infobulle ET dans le panneau. Facultatif. */
  warning: string;
  services: ServiceMirai[];
};

/** Lit le menu dans la configuration, ou `null` s'il n'y en a pas d'exploitable. */
export const lireMenu = (config?: ApiConfig): MenuMirai | null => {
  const brut = config?.FRONTEND_MIRAI_SERVICES;
  const services = brut?.services?.filter((s) => s?.name && s?.host);
  if (!brut?.domain || !services?.length) {
    return null;
  }
  return {
    domain: brut.domain,
    current: brut.current ?? "",
    warning: brut.warning ?? "",
    services,
  };
};

/**
 * Le service sur lequel on se trouve. Le sous-domaine du navigateur fait foi — c'est lui
 * qui reste juste si la même image sert deux domaines — et la configuration tranche quand
 * il ne correspond à rien de connu, en développement par exemple.
 */
export const serviceCourant = (menu: MenuMirai, hostname: string): string => {
  const sousDomaine = (hostname.split(".")[0] || "").toLowerCase();
  return menu.services.some((s) => s.host === sousDomaine)
    ? sousDomaine
    : menu.current;
};
