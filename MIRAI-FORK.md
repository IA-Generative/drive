# Ce fork et son écart avec l'amont

Fork de `suitenumerique/drive`, utilisé pour servir une instance « Mes fichiers » exploitée
par le ministère de l'Intérieur dans le cadre de MirAI. Ce fichier est le point d'entrée à
lire **avant** de remonter le fork sur une nouvelle version de l'amont : il dit ce qui
diverge, pourquoi, et comment rejouer.

Il vit à la racine, dans un fichier que l'amont ne touchera jamais — il survit donc à tous
les rebases.

## Base amont courante

| | |
|---|---|
| Version | `v0.21.1` (`ef1f1a78`) |
| Remontée le | 2026-08-22 |
| Base précédente | `v0.18.0-preprod` (`3293ce52`), soit 186 commits de retard |

## Les quatre écarts

Tout le reste de l'historique du fork est constitué de commits qui s'annulent entre eux
(une configuration de déploiement ajoutée puis retirée, partie vivre ailleurs) et ne laisse
aucune trace dans le diff.

### 1. `🐛(media-auth)` — retirer les paramètres `X-Amz-*` avant la re-signature SigV4

`src/backend/core/api/utils.py`, dans `generate_s3_authorization_headers()`.

La fonction demande à boto3 une URL pré-signée, puis la re-signe en mode *header-based*
avec `S3SigV4Auth`. Or l'URL rendue par `generate_presigned_url()` porte toujours des
paramètres de requête `X-Amz-*`, qui entrent dans la *canonical query string* de la requête
canonique signée.

Quand l'ingress nginx transmet à l'objet de stockage les seuls en-têtes SigV4 via son
mécanisme `auth-response-headers`, ces paramètres de requête ne sont **pas** propagés. S3
recalcule donc une requête canonique avec une query string vide, obtient une empreinte
différente, et répond `403 SignatureDoesNotMatch` sur chaque `GET /media/<clé>`.

Le correctif tronque l'URL à son chemin avant de construire l'`AWSRequest`.

**Avant de remonter** : vérifier si l'amont a corrigé la fonction entre-temps. Si oui, ce
patch disparaît. Au 2026-08-22, ce n'est pas le cas.

### 2. `✨(frontend)` — le badge « by MirAI »

Une pilule blanche ancrée à droite du logo, avec une queue de bulle qui pointe vers lui.
Masquée sous le breakpoint tablette, où l'en-tête n'a pas de place à perdre.

`MiraiBadge.tsx` (7 lignes, aucun import) dans
`src/frontend/apps/drive/src/features/layouts/components/header/`, monté à **deux**
endroits : l'en-tête de l'application (`Header.tsx`) et l'en-tête de la page d'accueil
publique (`pages/index.tsx`), qui a sa propre barre. Styles dans `header/index.scss`.

### 3. `✨(frontend)` — l'habillage MirAI

Trois changements qui vont ensemble : cette instance n'est pas une instance de LaSuite, et
son interface ne doit pas prétendre le contraire.

- **Le menu des services.** La gaufre LaSuite listait Tchap, Docs, Visio, Grist… — des
  services dont cette instance ne fait pas partie. `Gaufre.tsx` rend désormais le menu des
  services MirAI (`features/mirai/`). Le remplacement est fait dans `Gaufre.tsx` plutôt
  que chez ses appelants : l'en-tête et l'explorateur le montent tous deux, et tout
  appelant futur suivra sans y penser. Le widget d'origine se chargeait depuis un domaine
  externe ; le menu MirAI est servi par l'application. Une dépendance réseau de moins.
- **Le bloc-marque.** « GOUVERNEMENT » devient « Ministère de l'Intérieur ». Le drapeau et
  la Marianne sont repris **tels quels** de `assets/logo-gouv.svg`, l'asset de l'amont :
  mêmes tracés, mêmes couleurs, aucun redessin. Seuls le libellé et la devise changent, et
  ils sont du vrai texte — ils héritent de la police Marianne chargée par le kit
  d'interface et se lisent au lecteur d'écran.
- **Le texte d'accueil.** `home.subtitle` dit maintenant que l'instance est gérée par le
  ministère de l'Intérieur dans le cadre de MirAI, dans les trois langues du fichier de
  traduction, et ne promet plus la synchronisation avec « toutes les applications
  LaSuite ».

> **Tout ce qui doit flotter au-dessus de la page doit quitter la barre du haut.**
> `.c__main-layout__header` est en `position: fixed` sans `z-index` : un élément fixe crée
> un contexte d'empilement de toute façon, et tout ce qui est peint dedans reste au
> niveau 0 de la racine — le contenu de la page, qui vient après dans le document, passe
> par-dessus. Aucune valeur de `z-index` n'y change rien : elle ne classe qu'à l'intérieur
> du contexte. Le panneau du menu est donc rendu dans `document.body` par un portail, et
> positionné depuis le rectangle du bouton. Toute future incrustation ancrée à la barre
> rencontrera le même mur.

> **Ce que le fork duplique, et ce qu'il ne duplique plus.** La *liste* des services ne
> vit pas ici : elle arrive par `FRONTEND_MIRAI_SERVICES`, un réglage du backend
> renseigné au déploiement. Ce dépôt est public, et la liste nomme les sous-domaines de
> tous les services — y compris ceux qui ne sont pas encore ouverts. Réglage absent : pas
> de menu, et rien de cassé.
>
> Ce qui reste dupliqué, c'est le *mécanisme* : `MiraiServicesMenu.tsx` réimplémente en
> React ce que le socle fait en JavaScript autonome. C'est la dette que le prompt de
> portage redoutait, et elle est assumée le temps que l'habillage commun devienne un
> fichier que Drive puisse charger comme les autres — ce jour-là, `features/mirai/`
> disparaît au profit de lui.
>
> **Le réglage est un littéral Python, pas du JSON** : la configuration de Drive le lit
> avec `ast.literal_eval`, donc `True` et `False`, jamais `true` et `false`. Un booléen
> minuscule fait échouer la lecture, le réglage retombe à vide, et le menu disparaît sans
> que rien ne dise pourquoi.

### 4. `✨(frontend)` — dire ce qui n'est pas encore branché (retours de la bêta)

Consigne de la bêta : ne retirer **aucune** fonction. Ce qui n'est pas branché sur cette
instance reste à l'écran, mais dit ce qu'il fait vraiment. Chaque point porte
l'identifiant du retour dans son message de commit.

- **F1 — « Nouveau » document texte, diapositives, tableau.** Aucun éditeur en ligne
  n'est branché (`WOPI_CLIENTS` vide) : le fichier est créé **vide** depuis un modèle,
  et son aperçu ne propose que « Télécharger ». Les trois entrées restent ; elles
  portent un sous-texte « En construction — fichier vide à télécharger »
  (`useCreateMenuItems.tsx`), la fenêtre de création le redit avec la pastille
  (`ExplorerCreateFileModal.tsx`), et l'en-tête de l'aperçu d'un document bureautique
  sans éditeur affiche « Édition en ligne pas encore disponible », avec une infobulle
  (`CustomFilesPreview.tsx`). La pastille est un seul composant,
  `features/mirai/EnConstruction.tsx` : `grep EnConstruction` retrouve tous ses usages.
  **Le jour où un éditeur est branché**, retirer le sous-texte et le paragraphe de la
  fenêtre ; l'aperçu, lui, se tait seul (il lit `is_wopi_supported`).
- **F2 — « Récents » et les images d'Imagerie.** Imagerie n'écrit pas dans Drive. Le
  texte d'état vide de « Récents » (`explorer.grid.empty.cta.recent`, français
  seulement) le dit et donne le chemin : télécharger depuis Imagerie, puis importer.
- **F6 — écran d'entrée.** `home.subtitle` (français) commence par ce que fait
  l'application — stocker ses documents de travail et les partager entre agents du
  ministère — puis dit qui la gère. Les qualificatifs invérifiables (« performant »,
  « sécurité renforcée », « hébergement en France ») sont partis ; aucune intégration
  avec Docs n'existe, la phrase n'en parle pas. L'anglais et le néerlandais gardent le
  texte de l'écart 3.

## Remonter sur une nouvelle version de l'amont

```bash
git fetch origin --prune --tags
git fetch origin main:main     # fast-forward de main sans changer de branche
git status --porcelain         # doit être vide : tout commiter AVANT de rebaser
git rebase main
```

Ne jamais rebaser en laissant du travail non commité : le badge a vécu des mois en
modification non suivie, à un `git checkout` malheureux de sa disparition.

Contrôle d'arrivée — le diff avec l'amont doit tenir dans cette liste, pas un fichier de
plus :

```bash
git diff main..HEAD --stat
```

| Fichier | Écart |
|---|---|
| `MIRAI-FORK.md` | ce fichier |
| `.gitignore` | `deploy/` hors du dépôt public |
| `src/backend/core/api/utils.py` | correctif SigV4 |
| `src/backend/drive/settings.py` | réglage `FRONTEND_MIRAI_SERVICES` |
| `src/backend/core/api/viewsets.py` | le réglage exposé par `/api/v1.0/config/` |
| `.../header/MiraiBadge.tsx` | le badge (nouveau) |
| `.../header/Header.tsx` | montage du badge |
| `.../header/index.scss` | styles du badge |
| `pages/index.tsx` | bloc-marque + badge sur l'accueil |
| `pages/index.scss` | règle mobile du bloc-marque |
| `.../gaufre/Gaufre.tsx` | menu des services à la place de la gaufre |
| `features/mirai/` | menu, bloc-marque, lecture du réglage, pastille « En construction » (nouveau) |
| `features/drivers/types.ts` | type du réglage |
| `features/i18n/translations.json` | texte d'accueil et libellés de l'écart 4, 3 langues |
| `.../hooks/useCreateMenuItems.tsx` | F1 : sous-texte « En construction » |
| `.../modals/ExplorerCreateFileModal.tsx` | F1 : avertissement « fichier vide » |
| `features/ui/preview/CustomFilesPreview.tsx` | F1 : mention dans l'en-tête de l'aperçu |
| `styles/globals.scss` | branchement de `mirai.scss` |

Un fichier hors de cette liste signifie qu'un écart s'est glissé sans être documenté ici :
le documenter, ou le retirer.

**Les fichiers les plus exposés au conflit** sont ceux que l'amont fait vivre :
`pages/index.tsx`, `translations.json` et `globals.scss`. Les nôtres (`features/mirai/`,
`MiraiBadge.tsx`) ne bougent jamais sous nos pieds. Si l'amont refond sa page d'accueil,
c'est là qu'il faudra retravailler — pas ailleurs.

## Points ouverts

- **Le badge est candidat au retrait.** Un encart de services, portant sa propre pastille
  MirAI, doit arriver sur Drive. Le jour où il arrive, deux marques MirAI coexisteraient à
  l'écran — trois avec le bloc-marque du ministère. Le badge disparaîtra vraisemblablement
  à ce moment-là. La décision n'est pas prise.
- **Le menu MirAI est une réimplémentation**, pas l'encart du socle. Voir l'encadré
  ci-dessus : c'est un état transitoire assumé, pas une cible.
- **Graphie.** « MirAI » depuis le 2026-08-22, aligné sur le reste de la plateforme. Une
  version antérieure du badge écrivait « MiRAI » : si ce rendu traîne encore quelque part,
  c'est lui qu'il faut corriger.

## Ce qui ne se trouve pas ici

Ce fork est **public**. La configuration de déploiement — valeurs Helm, provisionnement,
procédures d'exploitation — et le prompt de portage de l'encart vivent dans le dépôt privé
d'infrastructure. `deploy/` est gitignoré pour cette raison : rien de son contenu ne doit
être commité ici.

> **Ce que porte la release en service.** Le chart déployé est **déjà** en `0.21.1` — le
> même que celui de ce fork depuis la remontée. Rien à rattraper de ce côté : la prochaine
> livraison est un changement d'image, pas une montée de chart.
>
> **Les images ne se tirent pas de l'amont.** Le correctif SigV4 est un correctif de
> *backend* : l'image publique ne le porte pas. Les deux images — backend et frontend —
> sont construites depuis le même commit de ce fork, et épinglées à un tag qui suit la
> version d'amont, jamais `latest`. La recette, le registre et la procédure vivent dans le
> dépôt privé d'infrastructure ; ce fork n'en est que la source.
>
> **Ne jamais réécrire un tag d'image déjà servi.** Avec `imagePullPolicy: IfNotPresent`,
> les nœuds qui l'ont en cache gardent l'ancienne image pendant que les nœuds neufs tirent
> la nouvelle : deux versions servent en même temps, la base suit le schéma de l'une, et
> l'application répond une fois sur deux. C'est arrivé, ça a coûté des semaines à voir, et
> une réécriture de tag suffit à le refaire. Un contenu nouveau prend un tag nouveau.
