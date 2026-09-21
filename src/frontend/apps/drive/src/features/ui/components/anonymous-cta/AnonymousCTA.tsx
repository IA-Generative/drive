import { login } from "@/features/auth/Auth";
import { useConfig } from "@/features/config/ConfigProvider";
import { Button } from "@gouvfr-lasuite/cunningham-react";
import { useTranslation } from "react-i18next";

export const AnonymousCTA = () => {
  const { t } = useTranslation();
  const { config } = useConfig();
  // MirAI : sans FRONTEND_EXTERNAL_HOME_URL, l'amont renvoyait vers « / » —
  // sur l'accueil, le bouton rechargeait la page et ne faisait rien. Il mène
  // désormais au même parcours que « Se connecter » : un seul chemin d'entrée.
  const tryOutUrl = config.FRONTEND_EXTERNAL_HOME_URL;
  return (
    <div className="anonymous-cta">
      <div className="anonymous-cta__separator" />
      <Button
        variant="tertiary"
        size="small"
        href={tryOutUrl}
        onClick={tryOutUrl ? undefined : () => login()}
        id="anonymous-cta-try-out"
        data-testid="anonymous-cta-try-out"
      >
        {t("anonymous_cta.try_out")}
      </Button>
      <Button
        variant="primary"
        size="small"
        onClick={() => login()}
        data-testid="anonymous-cta-login"
      >
        {t("anonymous_cta.login")}
      </Button>
    </div>
  );
};
