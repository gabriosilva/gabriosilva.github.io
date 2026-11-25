# Writing field notes

Every field note is one MDX file: Markdown, plus a few building blocks you can drop between paragraphs. Nothing needs importing.

## Add an entry

1. Create `content/field-notes/<slug>.mdx`.
2. Add it to the top of `PUBLISHED` in `content/field-notes/index.ts`:

```ts
{
  slug: 'morning-light-on-the-tracks',
  title: 'Morning light on the tracks',
  date: '2026-11-20',
  kind: 'Visual',            // Note · Essay · Study · Visual · Travel · Spread · Project
  summary: 'One sentence for the field-notes card and search results.',
  art: 'none',               // small picture on the card: pulse · ramp · window · spread · none
  experiment: undefined,     // name it to list the entry under Experiments
  load: () => import('./morning-light-on-the-tracks.mdx'),
},
```

3. Put images and audio in `public/field-notes/<slug>/` and refer to them as `/field-notes/<slug>/photo.jpg`.

The share preview (`/og/<slug>.png`) is made for you at build time from the title, kind and date, with the entry's `image` if it has one. The build fetches the fonts for it from Google Fonts; offline it falls back to a plain font.

Run `npm run dev` and open http://localhost:3000/field-notes/<slug>/.

## Examples to copy from

The entries marked **Demo** are worked examples of each kind of entry. They live in `EXAMPLES` in `content/field-notes/index.ts`, and they only exist on the development server: a production build leaves them out of the pages, the lists, the sitemap, the feed and the code, so they never reach the live site.

| To see how to write…                                       | Open                                         |
| ---------------------------------------------------------- | -------------------------------------------- |
| A short note                                               | `a-note-can-be-this-short.mdx`               |
| A study with something to play with, and Predict questions | `will-it-clear.mdx`, `a-few-connections.mdx` |
| A picture with a slider                                    | `a-window-a-little-light.mdx`                |
| A hand-arranged page (Spread)                              | `a-page-from-the-field.mdx`                  |

To publish one, move its object from `EXAMPLES` up into `PUBLISHED` and rewrite the text in your own voice. To preview a production build with the examples in it: `NEXT_PUBLIC_SHOW_DEMOS=1 npm run build`.

## Blocks

### Text

Ordinary Markdown: paragraphs, `## headings`, lists, _emphasis_, `> quotes`, and `---` for a section break (drawn as `· · ·`).

For a poem, keep the line breaks:

```mdx
<p className="poem">{`first line
second line`}</p>
```

### Margin note

Sits in the margin beside its line on wide screens; opens inline when tapped on a phone.

```mdx
The switch happens at about 63 ms.<Note n={1}>The extra 28 units take about 126 ms.</Note>
```

### Figure

A photo or drawing that opens from where it sits.

```mdx
<Figure
  src="/field-notes/my-entry/window.jpg"
  alt="Light on the kitchen wall"
  caption="Kitchen, 7:40 am."
/>
```

`placeholder="..."` shows an empty labelled frame while a photo doesn't exist yet. You can also put an SVG drawing inside `<Figure>...</Figure>` instead of `src`.

### Predict

Brilliant-style: the reader commits to a guess before seeing the answer.

```mdx
<Predict
  question="Which point fires last?"
  options={['E', 'F', 'G']}
  answer={1}
>
  F. The explanation goes here, and can include *Markdown*.
</Predict>
```

`answer` counts from 0.

### Spread

A field-notebook page. You place each piece; readers can touch and nudge them, and they spring back. On phones the pieces stack in order.

```mdx
<Spread height={700}>
  <Item x={0} y={2} w={44} rotate={-2} tape>
    <Figure src="/field-notes/my-entry/a.jpg" alt="..." caption="..." />
  </Item>
  <Item x={50} y={4} w={34} rotate={1.5} card>
    <Scribble>A note beside the photo.</Scribble>
  </Item>
</Spread>
```

`x`, `y` and `w` are percentages of the spread; `height` is in pixels. `tape` adds a strip of tape; `card` puts the piece on a paper card.

### Timeline

A loose, hand-placed timeline: a pen line down the middle, and stops on either side that settle into place like stickers as you scroll. On phones the line moves to the left and the stops stack. See `content/field-notes/new-york.mdx`.

```mdx
<Timeline>
  <Stop when="Wed 23 Sep · 8:47 pm" x={55} w={38} rotate={1.5} tape>
    <Figure
      src="/field-notes/my-entry/a.jpg"
      full="/field-notes/my-entry/a-large.jpg"
      width={1000}
      height={667}
      sizes="(min-width: 52rem) 22rem, 90vw"
      alt="..."
      caption="A short caption."
    />
  </Stop>
  <Aside x={66} w={18} shift={-9}>
    <Drawing name="steam" ambient />
    <Scribble>A note beside the sketch.</Scribble>
  </Aside>
  <Aside center w={72}>
    <Ferry />
  </Aside>
  <Stop end when="6:56 pm" w={58}>
    <Figure src="..." alt="..." caption="The last one." />
  </Stop>
</Timeline>
```

- **`<Stop>`** is a dated entry: it gets a dot on the line, a connector and its `when` label. Use it for photos.
- **`<Aside>`** is for sketches and interactive pieces. It is placed the same way but has no dot, connector or time.
- `x` and `w` are % of the timeline width; keep a piece entirely on one side (`x + w` below 50, or `x` from 50). `shift` pulls it up (negative) or down, in rem, so the two sides interleave. `center` puts it across the line.
- `end` marks the last stop: the line finishes at its dot and the photo hangs centred below it.
- `ambient` makes a small drawing (`steam`, `rain`) loop quietly while it's on screen.
- **Clicking any photo opens all the timeline's photos as one sequence**, with a small pen line and a dot per photo. Arrow keys, the on-screen arrows, a swipe or the dots move along it, and closing returns to the page at the photo you ended on. The viewer shows each photo's `caption` and its stop's `when`, and loads the `full` file.

### Sound

A recording, off until the reader presses play.

```mdx
<Sound src="/field-notes/my-entry/rain.mp3" title="Rain on the window, 30 s" />
```

### Unfold

A long sheet folded like an accordion. Tapping the cover lets it fall open, panel by panel; a link under it folds it back up. Each child goes on its own panel, and there are always at least four.

```mdx
<Unfold label="things that make me feel human">
  <Postit>I’m inspired by humanity.</Postit> {/* optional: tilt={-2} side="left|center|right" color="yellow|pink|blue|green" */}
  <Glued src="/field-notes/my-entry/photo.jpg" alt="…" width={1000} height={667} caption="optional" />
  <Written>A line written straight onto the paper.</Written>
  <Together> {/* several things on one panel, each placed with x, y and w, in % of the panel */}
    <Glued src="…" alt="…" width={640} height={640} x={33} y={50} w={38} aged="light" />
    <Pen x={82} y={36} w={26}>a few words</Pen>
  </Together>
</Unfold>
```

`Glued` also takes `inked="…"`, written in blue pen over the print's top-right corner, `aged="light"` for a photo that already has a filter, `wear={0–3}` to pick how it's worn, and `cutout` for a photo cut out around its subject (a transparent `.webp`; macOS Vision can make one). `Pen` writes in blue ballpoint straight onto the paper.

The paper, its creases and its stains are drawn by `lib/paper-shader.ts` (textures: CC0, ambientCG).

### Contraptions

The working parts. Each can be dropped into any entry.

```mdx
<PulseNetwork /> {/* optional: hold={250} to start with a longer pause */}
<BallRamp /> {/* optional: start={0.2} block={400} */}
<WindowLight />
<Ferry /> {/* the East River, drag the ferry from 4:58 to 6:56 pm */}
<Drawing name="flight" size="large" /> {/* any drawing from the Work page */}
```

New contraptions live in `components/contraptions/` (React) with their logic in `lib/contraptions/`. Register them in `mdx-components.tsx`.

### Drafting aids

```mdx
<Todo>check this number</Todo>
{/* visible in npm run dev only, never on the live site */}
<Demo>This entry is a placeholder.</Demo>
```

## The Work pages

Content is in `content/work.ts`, taken from the CV and GitHub. Everything shows on the one Work page: summary, what you did, tools and links. Each item can also have a `story` (`why`, `decisions`, `learned`); once written, those appear in the same row.

Each item's drawing is in `components/work/drawings.tsx`: a function of progress `t` from 0 to 1, drawn in a 160 × 100 box.
