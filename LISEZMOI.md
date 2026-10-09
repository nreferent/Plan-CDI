# Plan du CDI — mise en ligne sur Netlify

Le dossier contient :

- `public/index.html` : la page (plan 2D, vue 3D, mobilier, dispositions) ;
- `netlify/functions/api.mjs` : le petit serveur qui garde le catalogue et les dispositions dans Netlify Blobs, partagés par tous ceux qui ont le lien ;
- `netlify.toml`, `package.json` : la configuration.

## Première mise en ligne

Dans un terminal, depuis ce dossier :

```
npm install
netlify deploy --prod
```

À la première commande `netlify deploy`, choisissez « Create & configure a new project » (un nouveau site, distinct de celui de la salle info), puis acceptez le dossier `public` proposé.

## Mises à jour

Remplacez `public/index.html` par la nouvelle version, puis relancez `netlify deploy --prod`. Les dispositions et le catalogue enregistrés ne sont pas touchés.

## Vérifier que le partage fonctionne

En haut du bloc « Dispositions », la pastille doit être verte avec la mention « Enregistrement partagé ». Si elle reste grise (« Aperçu »), la fonction `api` n'a pas été déployée : relancez `npm install` puis `netlify deploy --prod`.
