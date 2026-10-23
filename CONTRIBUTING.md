# Contribuer · Contributing

**[Français](#français) · [English](#english)**

---

## Français

Merci de votre intérêt! En participant, vous acceptez le [code de conduite](CODE_OF_CONDUCT.md). Vous utilisez l’IA? Lisez la [politique sur l’IA](AI_POLICY.md).
Les issues et les demandes de tirage sont bienvenues en français ou en anglais.

### Installation

```bash
corepack enable
yarn install
yarn build   # lint, traductions, vérification des types, tests, puis dist/degel-carte.js
yarn start   # page de test sur http://localhost:5050/ (?dark&lang=en&width=320)
```

### Conventions

* **Le français d’abord.** Toute documentation est bilingue, avec la section française en premier.
  `src/localize/languages/fr.json` est la référence : `yarn lint` vérifie que `en.json` a les mêmes
  clés et les mêmes `{variables}`, et la carte se rabat sur le français s’il manque un texte.
* **La logique des dates** est dans `src/season.ts` et suit les mêmes règles que l’intégration
  (`custom_components/degel/season.py` dans [Dégel](https://github.com/olivierouellet/Degel)) :
  changer l’une, c’est changer l’autre.
* **Commits** : `[Sujet] Ce qui a changé`, un sujet par commit (par exemple `[Card]`, `[Docs]`, `[Tooling]`).

---

## English

Thanks for your interest! By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Using AI tools? Read the [AI policy](AI_POLICY.md).
Issues and pull requests are welcome in French or English.

### Setup

```bash
corepack enable
yarn install
yarn build   # lint, translations, type check, tests, then dist/degel-carte.js
yarn start   # test page at http://localhost:5050/ (?dark&lang=en&width=320)
```

### Conventions

* **French first.** All documentation is bilingual, with the French section first.
  `src/localize/languages/fr.json` is the reference: `yarn lint` checks that `en.json` has the same
  keys and `{placeholders}`, and the card falls back to French when a string is missing.
* **The date logic** is in `src/season.ts` and follows the same rules as the integration
  (`custom_components/degel/season.py` in [Dégel](https://github.com/olivierouellet/Degel)):
  change one, change the other.
* **Commits**: `[Topic] What changed`, one topic each (for example `[Card]`, `[Docs]`, `[Tooling]`).
