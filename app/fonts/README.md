# Site fonts

Self-hosted copies of the three Google Fonts the site uses, so builds don't download
them from Google (those downloads failed intermittently and broke builds, including
on Vercel). Visitors already got self-hosted files from `next/font/google`; this only
moves the download from build time into the repo.

| File | Font | Weights | Source |
| --- | --- | --- | --- |
| `crete-round-latin-400-normal.woff2` | Crete Round | 400 | @fontsource/crete-round 5.3.0 |
| `inter-latin-wght-normal.woff2` | Inter (variable) | 300-800 used | @fontsource-variable/inter 5.3.0 |
| `montserrat-latin-wght-normal.woff2` | Montserrat (variable) | 400-700 used | @fontsource-variable/montserrat 5.3.0 |

Latin subset only, the same as the previous `subsets: ['latin']`. All three are under
the SIL Open Font License 1.1 (see the LICENSE files here), which allows bundling them.
