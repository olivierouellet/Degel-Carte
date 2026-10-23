# Sécurité · Security Policy

**[Français](#français) · [English](#english)**

---

## Français

### Signaler une vulnérabilité

**N’ouvrez pas d’issue publique.** Signalez-la en privé par GitHub :

* [Signaler une vulnérabilité](https://github.com/olivierouellet/Degel-Carte/security/advisories/new)
  dans l’onglet **Security** du dépôt, visible seulement par le responsable, ou
* écrivez directement à [@olivierouellet](https://github.com/olivierouellet).

Utile à inclure : la version, ce qu’il faut pour exploiter le problème, et une façon de le reproduire.

C’est un projet à un seul responsable, fait sur son temps libre. Comptez un accusé de réception
d’ici deux semaines; vous saurez où en est la correction. Vous serez crédité dans les notes de
version si vous le souhaitez.

### Versions prises en charge

| Version | Prise en charge |
| --- | --- |
| Dernière version publiée | ✅ |
| `main` | ✅ Les correctifs y arrivent d’abord |
| Versions antérieures | ❌ Mettez à jour avec HACS |

### Surface d’attaque

* En mode direct, le navigateur télécharge le fichier des zones de Transports Québec (`ws.mapserver.transports.gouv.qc.ca`), sans clé ni donnée personnelle, et le garde 6 heures dans le stockage local.
* Rien de ce fichier n’est inséré comme HTML : la carte n’en extrait que des nombres et des dates, et Lit échappe tout le texte affiché.

---

## English

### Reporting a vulnerability

**Don't open a public issue.** Report privately through GitHub:

* [Report a vulnerability](https://github.com/olivierouellet/Degel-Carte/security/advisories/new)
  from the repository's **Security** tab, visible only to the maintainer, or
* contact [@olivierouellet](https://github.com/olivierouellet) directly.

Useful to include: the version, what an attacker needs, and a way to reproduce it.

This is a one-maintainer, spare-time project. Expect acknowledgement within 2 weeks, and you'll
be told where the fix stands. Credit in the release notes if you'd like it.

### Supported versions

| Version | Supported |
| --- | --- |
| Latest release | ✅ |
| `main` | ✅ Fixes land here first |
| Earlier releases | ❌ Update through HACS |

### Attack surface

* In direct mode, the browser downloads the zones file from Transports Québec (`ws.mapserver.transports.gouv.qc.ca`), with no key and no personal data, and keeps it for 6 hours in local storage.
* Nothing from that file is inserted as HTML: the card only takes numbers and dates from it, and Lit escapes all the text it shows.
