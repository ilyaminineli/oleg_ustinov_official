# Oleg Ustinov — Artist Website

A minimalist archive and portfolio website for artist **Oleg Ustinov**.

## Structure

- **about** — biography and artistic practice
- **works** — dynamic work archive grouped by year and series
- **projects** — projects and side practices
- **exhibitions** — selected exhibitions and milestones
- **contact** — contact and external links

## Works archive

The works page reads the repository tree directly from GitHub. This keeps the public archive synchronized with the material stored in the repository instead of maintaining a second manual catalogue in JavaScript.

Image metadata is parsed from filenames. The archive extracts the work title, year, materials and dimensions where they are present, while the folder structure supplies the year and series context. Series folders are rendered as series sections; files identified as details or fragments are separated into a **details** subsection within their series.

The interface builds hashtag-style filters automatically from the available archive: years, media/materials, details and series. Works can also be sorted by year or medium. Clicking any image opens a fullscreen preview.

Because the archive is generated from the repository tree, adding or removing images from `img/` automatically changes the public works catalogue on the next page load. Filenames therefore remain the single source of work metadata.

## Conception texts

The `txt/` directory is scanned together with the image archive. Concept folders are collected into a separate **conceptions** index at the bottom of the works page, with links to the original documents stored in the repository. This keeps the research/conceptual material connected to the visual archive without duplicating the source documents.

## Content

The public website is presented in English. Series and concept names are normalized for display where necessary, while artwork titles and technical metadata come from the artist’s source filenames.

Artist information and selected biographical/exhibition metadata are based on publicly available materials from VLADEY and other exhibition sources. The website is an independent portfolio presentation.
