import { useConfig } from "@/features/config/ConfigProvider";
import { MiraiServicesMenu } from "@/features/mirai/MiraiServicesMenu";

/**
 * La gaufre LaSuite listait Tchap, Docs, Visio, Grist… — les services de LaSuite, dont
 * cette instance ne fait pas partie. Elle est remplacée par le menu des services MirAI.
 *
 * Le remplacement se fait ICI plutôt que sur chaque appelant : l'en-tête et l'explorateur
 * montent tous deux ce composant, et tout appelant futur suivra sans y penser.
 *
 * Le widget d'origine se chargeait depuis un domaine externe (`lagaufre.js`) : le menu
 * MirAI, lui, est servi par l'application elle-même. Une dépendance réseau de moins.
 */
export const Gaufre = () => {
  const { config } = useConfig();

  if (config?.FRONTEND_HIDE_GAUFRE) {
    return null;
  }

  return <MiraiServicesMenu />;
};
