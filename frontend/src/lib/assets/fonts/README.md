# PDF fonts

**Last Updated:** 2026-10-26 15:54 EDT

DejaVu Sans regular, bold and oblique are embedded in generated PDFs so Latin,
Cyrillic and Hebrew names and prose remain readable. Font bytes are fetched only
when a PDF is requested, then cached for subsequent exports in that page session.

The unmodified TrueType files are from the bundled LibreOffice runtime's DejaVu
font distribution. The upstream project is https://dejavu-fonts.github.io/ and
the accompanying `LICENSE-DejaVu.txt` preserves its redistribution terms
(Bitstream Vera license; DejaVu changes are public domain). No paid service or
external font request is used by the application.

The three font assets total about 2.1 MB before transfer compression. Generated
PDFs embed subsets of the styles actually used. Hebrew paragraphs use their
original paragraph direction, including wrapped lines and embedded English.
Each written line also carries standard PDF `ActualText` with the original
logical UTF-16 text. Extractors that ignore that metadata may return mixed RTL
text in display order; copying mixed-script prose depends on the PDF reader.

These fonts cover the scripts above; this is not a claim of universal glyph
coverage for every writing system or emoji.
