/**
 * Authored ASCII rendering of the v2 triquetra mark, embedded verbatim from
 * .brief/branding/triquetra-v2-ascii.txt (a gitignored working file — its
 * CONTENT lives here, it is never imported from .brief).
 *
 * Hand-approved art. Only per-line trailing whitespace was stripped and the
 * file's empty trailing padding lines dropped; every other space is exact, so
 * the monospace grid lines up. World Code renders this in the matrix phase in
 * place of the old runtime braille rasterizer.
 */
export const TRIQUETRA_ASCII: string[] = [
  "                ;@PVVS5|",
  "              4XYTWZZZZZYH,",
  "            ;R|     :BZZZZXT",
  "           ,Ji        JZZZZU|",
  "                      ;ZZZZZq",
  "                      !ZZZZZm",
  "                  ha  AZZZZR:",
  "                 QXB  WZZZZq",
  "              |3VZY:  XZZZK",
  "       I84KZZZZZZZo   WZZZ@",
  "    TGZZZZZZZZZZNi    :YZZb       i:",
  "   3ZZZZZZZZZI8        ZWZ0        18",
  "  @ZZZZZYFa    ,mkkkO.   *N9.       D@",
  "  NZZZYw     2XXZZZZZZZ3i           3M",
  "  PZZV.           @ZZZZZZU0        |SO",
  "  2ZZL              2YZZZZZYAC. .J8ZZ8",
  "   HZY|              .KZZZZZZZZZZZZZI",
  "    QRZ4I              ;MYZZZZZZZZUq",
  "       J1PQLo             13QRQHw",
];

/** Grid dimensions of the art (rows = lines, cols = widest line). */
export const ASCII_ROWS = 19;
export const ASCII_COLS = 38;

/**
 * The falling matrix "head" character: the densest glyph the art itself uses,
 * so the rain reads as the mark's own texture rather than a foreign symbol.
 */
export const ASCII_HEAD = "Z";
