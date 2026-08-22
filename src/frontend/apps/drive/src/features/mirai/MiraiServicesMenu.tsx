import { useEffect, useRef, useState } from "react";
import { useConfig } from "@/features/config/ConfigProvider";
import { MarianneFlag } from "./MinistereInterieurLogo";
import { lireMenu, serviceCourant } from "./services";

/**
 * Le menu des services voisins, à la place de la gaufre LaSuite.
 *
 * Même contenu et même comportement que l'encart du socle : la liste des autres services,
 * « vous êtes ici » sur celui qu'on regarde, « bientôt » sur ceux qui ne sont pas ouverts,
 * l'avertissement au survol ET dans le panneau — le survol n'existe pas au doigt —, et la
 * fermeture par Échap comme par clic extérieur.
 *
 * Ce n'est PAS l'encart du socle : c'est une réimplémentation, le temps que l'habillage
 * commun devienne un fichier autonome que Drive puisse charger comme les autres. Ce qu'il
 * affiche, en revanche, ne vit pas ici : voir `services.ts`.
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
  const { config } = useConfig();
  const menu = lireMenu(config);

  const [ouvert, setOuvert] = useState(false);
  const [ici, setIci] = useState(menu?.current ?? "");
  const conteneur = useRef<HTMLDivElement>(null);

  // Le sous-domaine n'existe pas au rendu serveur : on le lit une fois monté, sinon le
  // HTML rendu côté serveur et celui du navigateur ne concordent pas.
  useEffect(() => {
    if (menu) {
      setIci(serviceCourant(menu, window.location.hostname));
    }
  }, [menu]);

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

  // Pas de liste configurée, pas de menu : mieux vaut rien qu'une liste inventée.
  if (!menu) {
    return null;
  }

  return (
    <div className="mirai-services" ref={conteneur}>
      <button
        type="button"
        className="mirai-services__button"
        aria-haspopup="true"
        aria-expanded={ouvert}
        aria-controls="mirai-services-panneau"
        aria-label="Les autres services"
        title={menu.warning || undefined}
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

        {menu.warning && (
          <p className="mirai-services__avertissement">{menu.warning}</p>
        )}

        <div className="mirai-services__titre">Les autres services</div>

        <ul className="mirai-services__liste">
          {menu.services.map((service) => {
            if (service.host === ici) {
              return (
                <li key={service.host}>
                  <span className="mirai-services__inactif" aria-current="page">
                    {service.name}
                    <span className="mirai-services__note">vous êtes ici</span>
                  </span>
                </li>
              );
            }
            if (service.online === false) {
              return (
                <li key={service.host}>
                  <span className="mirai-services__inactif">
                    {service.name}
                    <span className="mirai-services__note">bientôt</span>
                  </span>
                </li>
              );
            }
            return (
              <li key={service.host}>
                <a
                  href={`https://${service.host}.${menu.domain}/`}
                  role="menuitem"
                >
                  {service.name}
                  {service.about && (
                    <span className="mirai-services__note">
                      {service.about}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
