import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Resume, ContactInfo } from "./types";

const COLORS = {
  black: rgb(0.1, 0.1, 0.12),
  dark: rgb(0.2, 0.2, 0.23),
  gray: rgb(0.4, 0.4, 0.45),
  light: rgb(0.6, 0.6, 0.65),
  accent: rgb(0.33, 0.28, 0.75),
  line: rgb(0.88, 0.88, 0.9),
};

const PAGE_WIDTH = 612; // Letter width in points
const PAGE_HEIGHT = 792; // Letter height in points
const MARGIN_LEFT = 54;
const MARGIN_RIGHT = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

export async function generateResumePDF(resume: Resume, contactInfo?: ContactInfo): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - 50;

  const MARGIN_BOTTOM = 50;

  // Add a new page and reset y position
  const addPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 50;
  };

  // Ensure enough space, add a new page if needed
  const ensureSpace = (needed: number) => {
    if (y < MARGIN_BOTTOM + needed) {
      addPage();
    }
  };

  // Helper to draw text
  const drawText = (
    text: string,
    x: number,
    yPos: number,
    options: {
      font?: typeof helvetica;
      size?: number;
      color?: typeof COLORS.black;
      maxWidth?: number;
    } = {}
  ) => {
    const font = options.font || helvetica;
    const size = options.size || 10;
    const color = options.color || COLORS.dark;
    const maxWidth = options.maxWidth || CONTENT_WIDTH;

    // Word-wrap text
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    for (const line of lines) {
      if (yPos < MARGIN_BOTTOM) {
        addPage();
        yPos = y;
      }
      page.drawText(line, { x, y: yPos, size, font, color });
      yPos -= size + 4;
    }

    return yPos;
  };

  // Helper: draw a section header
  const drawSectionHeader = (title: string, yPos: number) => {
    ensureSpace(30);
    yPos = y; // use updated y after ensureSpace
    yPos -= 6;
    page.drawText(title.toUpperCase(), {
      x: MARGIN_LEFT,
      y: yPos,
      size: 9,
      font: helveticaBold,
      color: COLORS.accent,
    });
    yPos -= 7;
    page.drawLine({
      start: { x: MARGIN_LEFT, y: yPos },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPos },
      thickness: 0.5,
      color: COLORS.line,
    });
    yPos -= 10;
    return yPos;
  };

  // ─── NAME ───
  page.drawText(resume.name, {
    x: MARGIN_LEFT,
    y: y,
    size: 22,
    font: helveticaBold,
    color: COLORS.black,
  });
  y -= 20;

  // ─── TITLE ───
  page.drawText(resume.title, {
    x: MARGIN_LEFT,
    y: y,
    size: 11,
    font: helvetica,
    color: COLORS.accent,
  });
  y -= 16;

  // ─── CONTACT INFO ───
  if (contactInfo) {
    const contactParts: string[] = [];
    if (contactInfo.githubUrl) contactParts.push(contactInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, ""));
    if (contactInfo.linkedinUrl) contactParts.push(contactInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ""));
    if (contactInfo.phone) contactParts.push(contactInfo.phone);
    if (contactInfo.address) contactParts.push(contactInfo.address);

    if (contactParts.length > 0) {
      const contactText = contactParts.join("  |  ");
      y = drawText(contactText, MARGIN_LEFT, y, {
        size: 8.5,
        color: COLORS.gray,
      });
      y -= 4;
    }
  }
  y -= 4;

  // ─── SUMMARY ───
  y = drawSectionHeader("Summary", y);
  y = drawText(resume.summary, MARGIN_LEFT, y, {
    size: 9.5,
    color: COLORS.dark,
  });
  y -= 8;

  // ─── SKILLS ───
  y = drawSectionHeader("Skills", y);
  const skillsText = resume.skills.join("  |  ");
  y = drawText(skillsText, MARGIN_LEFT, y, {
    size: 9,
    color: COLORS.dark,
  });
  y -= 8;

  // ─── EXPERIENCE ───
  if (resume.experience.length > 0) {
    y = drawSectionHeader("Experience", y);

    for (const exp of resume.experience) {
      ensureSpace(40);

      // Role and Company
      page.drawText(exp.role, {
        x: MARGIN_LEFT,
        y: y,
        size: 10,
        font: helveticaBold,
        color: COLORS.black,
      });

      const durationWidth = helvetica.widthOfTextAtSize(exp.duration, 9);
      page.drawText(exp.duration, {
        x: PAGE_WIDTH - MARGIN_RIGHT - durationWidth,
        y: y,
        size: 9,
        font: helvetica,
        color: COLORS.gray,
      });
      y -= 14;

      page.drawText(exp.company, {
        x: MARGIN_LEFT,
        y: y,
        size: 9,
        font: helvetica,
        color: COLORS.gray,
      });
      y -= 14;

      // Highlights
      for (const highlight of exp.highlights) {
        y = drawText(`•  ${highlight}`, MARGIN_LEFT + 8, y, {
          size: 9,
          color: COLORS.dark,
          maxWidth: CONTENT_WIDTH - 16,
        });
        y -= 2;
      }
      y -= 6;
    }
  }

  // ─── PROJECTS ───
  if (resume.projects.length > 0) {
    y = drawSectionHeader("Projects", y);

    for (const proj of resume.projects) {
      ensureSpace(40);

      page.drawText(proj.name, {
        x: MARGIN_LEFT,
        y: y,
        size: 10,
        font: helveticaBold,
        color: COLORS.black,
      });
      y -= 13;

      y = drawText(proj.description, MARGIN_LEFT, y, {
        size: 9,
        color: COLORS.dark,
      });
      y -= 2;

      // Project highlights
      if (proj.highlights && proj.highlights.length > 0) {
        for (const highlight of proj.highlights) {
          y = drawText(`•  ${highlight}`, MARGIN_LEFT + 8, y, {
            size: 9,
            color: COLORS.dark,
            maxWidth: CONTENT_WIDTH - 16,
          });
          y -= 2;
        }
      }

      if (proj.tech.length > 0) {
        y = drawText(proj.tech.join(", "), MARGIN_LEFT, y, {
          size: 8.5,
          color: COLORS.gray,
        });
      }
      y -= 8;
    }
  }

  // ─── EDUCATION ───
  if (resume.education.length > 0) {
    y = drawSectionHeader("Education", y);

    for (const edu of resume.education) {
      ensureSpace(30);

      page.drawText(edu.degree, {
        x: MARGIN_LEFT,
        y: y,
        size: 10,
        font: helveticaBold,
        color: COLORS.black,
      });

      const yearWidth = helvetica.widthOfTextAtSize(edu.year, 9);
      page.drawText(edu.year, {
        x: PAGE_WIDTH - MARGIN_RIGHT - yearWidth,
        y: y,
        size: 9,
        font: helvetica,
        color: COLORS.gray,
      });
      y -= 14;

      page.drawText(edu.institution, {
        x: MARGIN_LEFT,
        y: y,
        size: 9,
        font: helvetica,
        color: COLORS.gray,
      });
      y -= 16;
    }
  }

  return doc.save();
}
