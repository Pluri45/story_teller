# Project standards: Olutola Owolabi portfolio

Read this file before every task and follow it for all code and content in this project. If a request conflicts with it, ask me first.

## 1. Copy and content
- First person only ("I", "my"). Never "he", "him", "his", "Olutola is" or "Olutola's" in anything a visitor sees. Exceptions: his name as a label, the photo alt text "Portrait of Olutola Owolabi", and this file and README.md.
- British English (colour, organisation, optimise).
- No em dashes or en dashes as punctuation. Use commas or full stops. Ranges use a plain hyphen: 2018-2021.
- Use "and" instead of "&" in sentences ("&" is fine in short labels).
- Only facts from the CV and LinkedIn profile doc. Never invent numbers, roles, dates or links. Use [PLACEHOLDER] for missing information and [CHECK] for anything that needs confirming.
- All text lives in /content/*.json, never hard-coded in HTML or JS.

## 2. HTML
- Semantic HTML5: header, nav, main, section, article, footer, one h1, headings in order (no skipped levels).
- Valid markup (W3C validator, no errors).
- Real elements for interaction: button for actions, a href for links. Never a clickable div or span.
- Every image has width, height and alt text (empty alt="" for decorative images).
- External links: target="_blank" rel="noopener noreferrer".

## 3. CSS
- Mobile-first: base styles for phones, then min-width media queries for larger screens.
- All colours, fonts, spacing and radii come from CSS variables (custom properties). No hard-coded colours outside the variables.
- Both themes (dark and light) and all four lenses must work for every component.
- BEM-style class names (block__element--modifier), matching the existing code.
- No !important unless there's no other way; explain it in a comment if used.
- Use rem for font sizes, clamp() for fluid headings.
- Every animation must respect prefers-reduced-motion.

## 4. JavaScript
- Vanilla JavaScript (ES2020+), no frameworks or libraries unless I approve.
- Scripts load with defer. No global variables: wrap code in modules or functions.
- Progressive enhancement: core content must still be readable if JavaScript fails.
- Handle failed fetches gracefully (show fallback content, never a blank section).
- No console errors or warnings in the browser.
- Keep functions small, named clearly, with a short comment explaining anything non-obvious.

## 5. Accessibility (WCAG 2.2 AA)
- Text contrast at least 4.5:1 (3:1 for large text) in both themes and all lenses.
- Everything works with a keyboard alone, with a clearly visible focus outline.
- Tap targets at least 44 x 44px on phones.
- Nothing important depends on hover only.
- aria-labels on icon-only buttons; aria-live for content that changes (like the lens subtitle).

## 6. Mobile and performance
- Test at 360px, 390px and desktop width after every change. No sideways scrolling, nothing cut off or overlapping.
- Body text at least 16px on phones.
- Images compressed (WebP where possible), sized for their display, and lazy-loaded below the first screen.
- Fonts loaded with display=swap; only the weights actually used.
- Target Lighthouse (mobile): Performance 90+, Accessibility 95+, Best Practices 95+, SEO 95+.

## 7. Security and privacy
- No API keys, passwords or private data in the code.
- Phone number never appears on the site.
- Contact form goes through Formspree only.

## 8. Files and Git
- Keep the existing folder structure: /index.html, /css, /js, /content, /assets.
- Lower-case, hyphenated file names (project-1.jpg, not Project 1.JPG).
- Delete any test or screenshot files before committing (except assets/img/logos/preview.png).
- Commit after each completed step with a clear message in the Conventional Commits style, e.g. "feat: add selected work section", "fix: correct Greep dates", "style: tighten mobile spacing".
- Never change git user settings or push without asking me.

## 9. Working style
- Explain changes in plain English; I'm new to coding.
- Ask before big decisions or installing anything.
- Take screenshots only once at the end of each step, and don't retry more than once.
