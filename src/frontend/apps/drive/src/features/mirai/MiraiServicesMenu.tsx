import { useEffect, useRef, useState } from "react";
import { MarianneFlag } from "./MinistereInterieurLogo";
import {
  AVERTISSEMENT_BETA,
  DOMAINE_MIRAI,
  SERVICES_MIRAI,
  SERVICE_COURANT,
  serviceCourant,
} from "./services";

/**
 * Le menu des services MirAI, à la place de la gaufre LaSuite.
 *
 * Même contenu et même comportement que l'encart du socle : la liste des autres
 * services, « vous êtes ici » sur celui qu'on regarde, « bientôt » sur ceux qui ne sont
 * pas ouverts, l'avertissement bêta au survol ET dans le panneau, fermeture par Échap.
 *
 * Ce n'est PAS l'encart du socle : c'est une réimplémentation, le temps que l'habillage
 * commun devienne un fichier autonome que Drive puisse charger comme les autres. La
 * liste des services est donc dupliquée — voir l'avertissement en tête de `services.ts`.
 */

const GrilleIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    aria-hidden="true"
    focusable="false"
  >
    <g fill="currentColor">
      {[0, 5.7, 11.4].map((y) =>
        [0, 5.7, 11.4].map((x) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="3.6" height="3.6" />
        )),
      )}
    </g>
  </svg>
);

export const MiraiServicesMenu = () => {
  const [ouvert, setOuvert] = useState(false);
  const [ici, setIci] = useState(SERVICE_COURANT);
  const conteneur = useRef<HTMLDivElement>(null);

  // Le sous-domaine n'existe pas au rendu serveur : on le lit une fois monté, sinon le
  // HTML rendu côté serveur et celui du navigateur ne concordent pas.
  useEffect(() => {
    setIci(serviceCourant(window.location.hostname));
  }, []);

  useEffect(() => {
    if (!ouvert) {
      return;
    }
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOuvert(false);
      }
    };
    const surClic = (e: MouseEvent) => {
      if (!conteneur.current?.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener("keydown", surTouche);
    document.addEventListener("mousedown", surClic);
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.removeEventListener("mousedown", surClic);
    };
  }, [ouvert]);

  return (
    <div className="mirai-services" ref={conteneur}>
      <button
        type="button"
        className="mirai-services__button"
        aria-haspopup="true"
        aria-expanded={ouvert}
        aria-controls="mirai-services-panneau"
        aria-label="Les autres services MirAI"
        title={AVERTISSEMENT_BETA}
        onClick={() => setOuvert((o) => !o)}
      >
        <GrilleIcon />
      </button>

      <div
        id="mirai-services-panneau"
        className="mirai-services__panneau"
        role="menu"
        hidden={!ouvert}
      >
        <div className="mirai-services__entete">
          <MarianneFlag className="mirai-services__flag" />
          <div className="mirai-services__rf">
            République Française
            <span className="mirai-services__ministere">
              Ministère de l&apos;Intérieur
            </span>
          </div>
        </div>

        <p className="mirai-services__avertissement">
          <b>MirAI Next Beta</b> — {AVERTISSEMENT_BETA}
        </p>

        <div className="mirai-services__titre">Les autres services</div>

        <ul className="mirai-services__liste">
          {SERVICES_MIRAI.map((service) => {
            if (service.hote === ici) {
              return (
                <li key={service.hote}>
                  <span className="mirai-services__inactif" aria-current="page">
                    {service.nom}
                    <span className="mirai-services__note">vous êtes ici</span>
                  </span>
                </li>
              );
            }
            if (!service.enLigne) {
              return (
                <li key={service.hote}>
                  <span className="mirai-services__inactif">
                    {service.nom}
                    <span className="mirai-services__note">bientôt</span>
                  </span>
                </li>
              );
            }
            return (
              <li key={service.hote}>
                <a
                  href={`https://${service.hote}.${DOMAINE_MIRAI}/`}
                  role="menuitem"
                >
                  {service.nom}
                  <span className="mirai-services__note">{service.quoi}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
