import { useTranslation } from "react-i18next";

/**
 * Pastille « En construction ».
 *
 * La consigne de la bêta est de ne retirer aucune fonction : ce qui n'est pas encore
 * branché reste visible, mais dit ce qu'il fait vraiment. Cette pastille marque ces
 * endroits — un seul composant, pour qu'on les retrouve tous d'un `grep` le jour où la
 * fonction arrive.
 */
export const EnConstructionBadge = () => {
  const { t } = useTranslation();
  return (
    <span className="mirai-en-construction">
      <span className="material-icons" aria-hidden="true">
        construction
      </span>
      {t("mirai.en_construction")}
    </span>
  );
};

/**
 * La pastille suivie d'une phrase qui dit ce qui se passe réellement.
 */
export const EnConstructionNotice = ({ children }: { children: string }) => (
  <p className="mirai-en-construction-notice" role="note">
    <EnConstructionBadge />
    <span>{children}</span>
  </p>
);
