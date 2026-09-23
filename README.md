# Elite Innovates

Marketing website for Elite Innovates Solutions Private Limited, built with Angular 22 and server-side rendering.

## Development

Use Node.js 26 or newer.

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Production

```bash
npm run build
npm run serve:ssr:eliteinnovates
```

The production output is generated in `dist/eliteinnovates` and includes nine prerendered routes.

### Static website content

Content is bundled from `src/app/data/` with no database or API dependency:

- `jobs.json`: career listings and descriptions. Each unique `slug` creates a `/jobs/:slug` page. Update the draft role descriptions here before publication.
- `catalog.json`: services and portfolio projects.
- `website.json`: company contact details, page copy, labels and page titles.

After editing JSON, rebuild the app to update the client bundle and prerendered pages. Application buttons open an email draft; applications are not stored by the website.
