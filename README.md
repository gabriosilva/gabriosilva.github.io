# gabriosilva.github.io

Gabrio Lina's personal site: work, field notes and interactive experiments.

Built with Next.js (static export), MDX and Motion. Published to GitHub Pages from the `gh-pages` branch by `npm run deploy` (Pages: Deploy from a branch, `gh-pages`, root). `.github/workflows/deploy.yml` can deploy with GitHub Actions instead.

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/
npm start        # serve out/ locally
npm run deploy   # build and publish to the gh-pages branch
```

- `app/`: pages (Home, Work, Field notes, Experiments, About)
- `content/`: site details, work items, field notes (MDX)
- `components/contraptions/`, `lib/contraptions/`: the interactive pieces
- `components/work/drawings.tsx`: the small drawing for each piece of work

To write an entry, see [WRITING.md](WRITING.md).
