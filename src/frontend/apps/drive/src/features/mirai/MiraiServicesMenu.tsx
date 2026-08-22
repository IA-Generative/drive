import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useConfig } from "@/features/config/ConfigProvider";
import { MarianneEmblem } from "./MarianneEmblem";
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
 *
 * LE PANNEAU EST POSÉ SUR `document.body`, PAS À CÔTÉ DU BOUTON. La barre du haut est en
 * `position: fixed` (`.c__main-layout__header`), ce qui crée un contexte d'empilement sans
 * `z-index` : tout ce qui est dedans est peint au niveau 0, et le contenu de la page, qui
 * vient après dans le document, passe par-dessus. Un `z-index: 1000` sur le panneau n'y
 * change rien — il ne vaut qu'à l'intérieur de ce contexte. Le sortir du contexte est la
 * seule chose qui marche, et c'est ce que fait l'habillage du socle lui aussi.
 */

const MARGE = 8;

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

  const [monte, setMonte] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [ici, setIci] = useState(menu?.current ?? "");
  const [ancre, setAncre] = useState({ top: 0, right: 0 });
  const bouton = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);

  // Le sous-domaine et `document` n'existent pas au rendu serveur : on les lit une fois
  // monté, sinon le HTML rendu côté serveur et celui du navigateur ne concordent pas.
  useEffect(() => {
    setMonte(true);
    if (menu) {
      setIci(serviceCourant(menu, window.location.hostname));
    }
  }, [menu]);

  // Le panneau étant sorti du flux, sa position se calcule depuis celle du bouton.
  const placer = useCallback(() => {
    const rect = bouton.current?.getBoundingClientRect();
    if (rect) {
      setAncre({
        top: rect.bottom + MARGE,
        right: Math.max(MARGE, window.innerWidth - rect.right),
      });
    }
  }, []);

  useEffect(() => {
    if (!ouvert) {
      return;
    }
    placer();
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOuvert(false);
        bouton.current?.focus();
      }
    };
    const surClic = (e: MouseEvent) => {
      const cible = e.target as Node;
      if (
        !bouton.current?.contains(cible) &&
        !panneau.current?.contains(cible)
      ) {
        setOuvert(false);
      }
    };
    document.addEventListener("keydown", surTouche);
    document.addEventListener("mousedown", surClic);
    window.addEventListener("resize", placer);
    // En capture : la barre est fixe, mais le défilement se fait dans un conteneur
    // interne dont l'événement ne remonte pas jusqu'à `window`.
    window.addEventListener("scroll", placer, true);
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.removeEventListener("mousedown", surClic);
      window.removeEventListener("resize", placer);
      window.removeEventListener("scroll", placer, true);
    };
  }, [ouvert, placer]);

  // Pas de liste configurée, pas de menu : mieux vaut rien qu'une liste inventée.
  if (!menu) {
    return null;
  }

  const panneauRendu = (
    <div
      ref={panneau}
      id="mirai-services-panneau"
      className="mirai-services__panneau"
      role="menu"
      style={{ top: ancre.top, right: ancre.right }}
      hidden={!ouvert}
    >
      <div className="mirai-services__entete">
        <MarianneEmblem size={32} />
        <div className="mirai-services__rf">
          République
          <br />
          Française
          <span className="mirai-services__ministere">
            Ministère de l&apos;Intérieur
          </span>
        </div>
      </div>

      {menu.warning && (
        <p className="mirai-services__avertissement">
          <b>MirAI Next Beta</b> — {menu.warning}
        </p>
      )}

      <div className="mirai-services__titre">Les autres services</div>

      <ul className="mirai-services__liste">
        {menu.services.map((service) => {
          if (service.host === ici) {
            return (
              <li key={service.host}>
                <span
                  className="mirai-services__inactif mirai-services__ici"
                  aria-current="page"
                >
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
                  <span className="mirai-services__note">{service.about}</span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="mirai-services">
      <button
        ref={bouton}
        type="button"
        className="mirai-services__button"
        aria-haspopup="true"
        aria-expanded={ouvert}
        aria-controls="mirai-services-panneau"
        aria-label="Les autres services"
        title={menu.warning || undefined}
        onClick={() => setOuvert((o) => !o)}
      >
        <MarianneEmblem size={22} />
        <span className="mirai-services__pastille">
          <span className="mirai-services__nom">MirAI</span> Next{" "}
          <span className="mirai-services__beta">Beta</span>
        </span>
        <GrilleIcon />
      </button>

      {monte && createPortal(panneauRendu, document.body)}
    </div>
  );
};
