<p align="center">
  <img src="https://raw.githubusercontent.com/olivierouellet/Degel/main/assets/icon.svg" alt="Logo de Dégel" width="128" height="128">
</p>

<h1 align="center">Dégel-Carte</h1>

<p align="center"><b><a href="#français">Français</a> · <a href="#english">English</a></b></p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/olivierouellet/Degel-Carte/main/images/screenshot-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/olivierouellet/Degel-Carte/main/images/screenshot-light.png">
    <img src="https://raw.githubusercontent.com/olivierouellet/Degel-Carte/main/images/screenshot-light.png" alt="Dégel-Carte en français et en anglais, le 16 avril : zones 1 et 2 en vigueur, zone 3 à venir · Dégel-Carte in French and English on April 16: zones 1 and 2 in effect, zone 3 upcoming" width="760">
  </picture>
</p>

---

## Français

Une carte de tableau de bord Home Assistant pour la **période de dégel au Québec** : les dates de restriction des charges des zones 1, 2 et 3 de Transports Québec.

- Pour chaque zone choisie : son **état** (à venir, en vigueur, terminée), ses dates et un **compte à rebours** (« Commence dans 4 jours », « Encore 29 jours »).
- Une **ligne du temps** commune avec le repère d’aujourd’hui et la progression de chaque période.
- Peut se **masquer d’elle-même hors de la saison de dégel**, et rester visible pendant la modification du tableau de bord.
- Des liens vers la page de Transports Québec et la carte des zones, et, au besoin, vers la carte des **limites de charge**.
- Un éditeur visuel. **En français et en anglais**, selon la langue de Home Assistant ou au choix pour chaque carte.
- Respecte votre thème, clair ou sombre.

### Deux façons d’obtenir les données

1. **Avec l’intégration [Dégel](https://github.com/olivierouellet/Degel) (recommandé).** Choisissez son capteur *Saison de dégel*. Les zones et les jours avant et après se règlent dans l’intégration, et vous obtenez aussi des capteurs pour vos automatisations et la visibilité de n’importe quelle carte.
2. **Directement de Transports Québec.** Cochez les zones dans l’éditeur; aucune intégration requise. Chaque tableau de bord ouvert télécharge le fichier des zones (quelques centaines d’octets, gardé 6 heures).

### Installation

**Avec HACS (recommandé)**

[![Ouvrir votre instance Home Assistant et ce dépôt dans HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=olivierouellet&repository=Degel-Carte&category=plugin)

1. Dans Home Assistant, ouvrez **HACS** → **⋮** (en haut à droite) → **Dépôts personnalisés**.
2. Dépôt : `https://github.com/olivierouellet/Degel-Carte`, type : **Dashboard** (tableau de bord), puis **Ajouter**. (Le bouton ci-dessus fait les étapes 1 et 2 pour vous.)
3. Cherchez **Dégel-Carte**, ouvrez-la et cliquez sur **Télécharger**. HACS ajoute la ressource du tableau de bord pour vous.
4. Rechargez votre navigateur (ou redémarrez l’application Home Assistant).

**Manuellement**

1. Téléchargez `degel-carte.js` de la dernière version (ou compilez-le : `yarn install && yarn build`, puis prenez `dist/degel-carte.js`).
2. Copiez-le dans `config/www/`.
3. *Paramètres → Tableaux de bord → ⋮ → Ressources → Ajouter une ressource* : URL `/local/degel-carte.js`, type **Module JavaScript**.

Ajoutez ensuite la carte depuis le sélecteur de cartes (cherchez « Dégel »).

### Options

| Option | Par défaut | Description |
|---|---|---|
| `entity` | — | Capteur *Saison de dégel* de l’intégration Dégel. Utilisez cette option **ou** `zones`. |
| `zones` | — | Mode direct : liste de zones, par exemple `[1, 2]`. |
| `days_before` | `14` | Mode direct : jours avant le début pendant lesquels la saison est en cours. (Avec `entity`, c’est l’intégration qui décide.) |
| `days_after` | `7` | Mode direct : jours après la fin. |
| `title` | Période de dégel | Titre de la carte. |
| `icon` | `mdi:truck-snowflake` | Icône à gauche du titre. |
| `hide_outside_season` | `false` | Masquer la carte hors de la saison de dégel. Elle reste visible quand vous modifiez le tableau de bord, avec une note. |
| `show_timeline` | `true` | Afficher la ligne du temps. |
| `show_today_label` | `true` | Afficher « Aujourd’hui » sous la ligne du temps. Le trait vertical reste affiché. |
| `show_links` | `true` | Afficher les liens vers Transports Québec et la carte des zones. |
| `show_load_limits` | `false` | Afficher le lien vers la carte des limites de charge (ponts et structures, toute l’année). |
| `short_links` | `true` | Liens abrégés : « Zones » et « Limites » au lieu de « Carte des zones » et « Limites de charge ». |
| `language` | `auto` | `auto` (langue de Home Assistant; le français si ce n’est pas l’anglais), `fr` ou `en`. |

### Exemples

```yaml
type: custom:degel-carte
entity: binary_sensor.degel_saison_de_degel
hide_outside_season: true
```

```yaml
type: custom:degel-carte
zones: [1, 2]
days_before: 21
days_after: 0
show_load_limits: true
language: fr
```

Pour masquer **une autre carte** autour du dégel, utilisez l’onglet *Visibilité* de cette carte avec le capteur *Saison de dégel* de l’intégration (voir le [README de Dégel](https://github.com/olivierouellet/Degel#afficher-une-carte-seulement-autour-du-dégel)).

### Développement

- `yarn install`, puis `yarn build` (lint, traductions, vérification des types, tests, bundle dans `dist/`).
- `yarn start` sert une page de test sur le port 5050 (pas 5000, que macOS réserve à AirPlay) : plusieurs dates et configurations, avec un faux Home Assistant. Options d’URL : `?dark&lang=en&width=320`.
- Ajoutez `http://<votre-ordinateur>:5050/degel-carte.js` comme ressource d’un tableau de bord pour essayer la version en cours dans Home Assistant.
- Voir [CONTRIBUTING.md](CONTRIBUTING.md).

Données : [Zone de dégel](https://www.donneesquebec.ca/recherche/dataset/zone-de-degel), ministère des Transports et de la Mobilité durable du Québec, sur Données Québec (CC BY 4.0). Les dates peuvent changer selon la météo; la référence reste la [page de la période de dégel](https://www.transports.gouv.qc.ca/fr/entreprises-partenaires/ent-camionnage/degel/Pages/Periode-de-degel.aspx). Dégel-Carte n’est pas affiliée au gouvernement du Québec.

---

## English

A Home Assistant dashboard card for **Québec’s spring thaw period** (*période de dégel*): the load restriction dates of Transports Québec’s zones 1, 2 and 3.

- For each chosen zone: its **status** (upcoming, in effect, ended), its dates and a **countdown** (“Starts in 4 days”, “29 days left”).
- A shared **timeline** with a marker for today and each period’s progress.
- Can **hide itself outside the thaw season**, while staying visible when you edit the dashboard.
- Links to Transports Québec’s page and the zone map, and optionally to the **load limits** map.
- A visual editor. **French and English**, following Home Assistant’s language or set per card.
- Follows your theme, light or dark.

### Two ways to get the data

1. **From the [Dégel](https://github.com/olivierouellet/Degel#english) integration (recommended).** Pick its *Thaw season* sensor. Zones and the days before and after are set in the integration, and you also get sensors for automations and for the visibility of any card.
2. **Directly from Transports Québec.** Tick zones in the editor; no integration needed. Each open dashboard downloads the zones file (a few hundred bytes, kept for 6 hours).

### Installation

**With HACS (recommended)**

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=olivierouellet&repository=Degel-Carte&category=plugin)

1. In Home Assistant, open **HACS** → **⋮** (top right) → **Custom repositories**.
2. Repository: `https://github.com/olivierouellet/Degel-Carte`, type: **Dashboard**, then **Add**. (The button above does steps 1 and 2 for you.)
3. Search for **Dégel-Carte**, open it and click **Download**. HACS adds the dashboard resource for you.
4. Reload your browser (or restart the Home Assistant app).

**Manual**

1. Download `degel-carte.js` from the latest release (or build it: `yarn install && yarn build`, then use `dist/degel-carte.js`).
2. Copy it to `config/www/`.
3. *Settings → Dashboards → ⋮ → Resources → Add resource*: URL `/local/degel-carte.js`, type **JavaScript module**.

Then add the card from the card picker (search for “Dégel”).

### Options

| Option | Default | Description |
|---|---|---|
| `entity` | — | *Thaw season* sensor from the Dégel integration. Use this **or** `zones`. |
| `zones` | — | Direct mode: list of zones, for example `[1, 2]`. |
| `days_before` | `14` | Direct mode: days before the start during which the season is on. (With `entity`, the integration decides.) |
| `days_after` | `7` | Direct mode: days after the end. |
| `title` | Thaw period | Card title. |
| `icon` | `mdi:truck-snowflake` | Icon left of the title. |
| `hide_outside_season` | `false` | Hide the card outside the thaw season. It stays visible while you edit the dashboard, with a note. |
| `show_timeline` | `true` | Show the timeline. |
| `show_today_label` | `true` | Show “Today” under the timeline. The vertical line stays. |
| `show_links` | `true` | Show links to Transports Québec and the zone map. |
| `show_load_limits` | `false` | Show a link to the load limits map (bridges and structures, year-round). |
| `short_links` | `true` | Short links: “Zones” and “Limits” instead of “Zone map” and “Load limits”. |
| `language` | `auto` | `auto` (Home Assistant’s language; French unless it is English), `fr` or `en`. |

### Examples

```yaml
type: custom:degel-carte
entity: binary_sensor.degel_thaw_season
hide_outside_season: true
```

```yaml
type: custom:degel-carte
zones: [1, 2]
days_before: 21
days_after: 0
show_load_limits: true
language: en
```

To hide **another card** around the thaw, use that card’s *Visibility* tab with the integration’s *Thaw season* sensor (see the [Dégel README](https://github.com/olivierouellet/Degel#show-a-card-only-around-the-thaw)).

### Development

- `yarn install`, then `yarn build` (lint, translations, type check, tests, bundle to `dist/`).
- `yarn start` serves a test page on port 5050 (not 5000, which macOS uses for AirPlay): several dates and configurations, with a mock Home Assistant. URL options: `?dark&lang=en&width=320`.
- Add `http://<your-computer>:5050/degel-carte.js` as a dashboard resource to try the live build in Home Assistant.
- See [CONTRIBUTING.md](CONTRIBUTING.md).

Data: [Zone de dégel](https://www.donneesquebec.ca/recherche/dataset/zone-de-degel), Québec Ministère des Transports et de la Mobilité durable, on Données Québec (CC BY 4.0). Dates can change with the weather; the reference remains the [thaw period page](https://www.transports.gouv.qc.ca/fr/entreprises-partenaires/ent-camionnage/degel/Pages/Periode-de-degel.aspx). Dégel-Carte is not affiliated with the Government of Québec.
