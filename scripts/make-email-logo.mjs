// Builds the email logo: 480px wide, solid white background (never transparent)
// so the black infinity stays visible in dark-mode inboxes.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const out = "src/emails/static/logo-email.png";
await mkdir("src/emails/static", { recursive: true });
const info = await sharp("design-mock/img/Base Logo - Dark.png")
  .resize({ width: 480 })
  .flatten({ background: "#ffffff" })
  .png({ compressionLevel: 9 })
  .toFile(out);
console.log(`${out}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
