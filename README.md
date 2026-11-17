# gabriosilva.github.io

Gabrio Lina's personal site: work, field notes and interactive experiments.

Built with Next.js (static export), MDX and Motion. Deployed to GitHub Pages from `main` by `.github/workflows/deploy.yml`.

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/
npm start        # serve out/ locally
```

- `app/`: pages (Home, Work, Field notes, Experiments, About)
- `content/`: site details, work items, field notes (MDX)
- `components/contraptions/`, `lib/contraptions/`: the interactive pieces
- `components/work/drawings.tsx`: the small drawing for each piece of work

To write an entry, see [WRITING.md](WRITING.md).
