import { Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import { Fragment, type CSSProperties, type ReactNode } from "react";

export const LOGO_CID = "serenedge-logo";

export const colors = {
  ink: "#0b0d12",
  muted: "#5b6470",
  soft: "#8f98a6",
  line: "#dfe3e9",
  surface: "#f6f7f9",
  accent: "#5b8ac5",
  white: "#ffffff",
} as const;

export const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

export const styles = {
  eyebrow: {
    margin: "0 0 10px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: colors.accent,
  },
  h1: { margin: "0 0 14px", fontSize: 28, lineHeight: "34px", fontWeight: 700, color: colors.ink },
  body: { margin: "0 0 20px", fontSize: 16, lineHeight: "26px", color: colors.muted },
  box: {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.line}`,
    borderRadius: 12,
    padding: "18px 20px",
    margin: "0 0 28px",
  },
  label: { margin: "0 0 4px", fontSize: 12, color: colors.soft, textTransform: "uppercase", letterSpacing: "0.06em" },
  value: { margin: "0 0 12px", fontSize: 15, lineHeight: "22px", color: colors.ink },
  quote: {
    margin: 0,
    fontSize: 15,
    lineHeight: "24px",
    color: colors.ink,
    borderLeft: `3px solid ${colors.accent}`,
    paddingLeft: 14,
  },
} satisfies Record<string, CSSProperties>;

/** Renders user text with its line breaks (React escapes the text itself). */
export function multiline(text: string): ReactNode {
  return text.split(/\r?\n/).map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

export function EmailButton({ href, children, variant = "primary" }: { href: string; children: string; variant?: "primary" | "secondary" }) {
  const primary = variant === "primary";
  return (
    <Button
      href={href}
      style={{
        backgroundColor: primary ? colors.ink : colors.white,
        color: primary ? colors.white : colors.ink,
        border: `1px solid ${primary ? colors.ink : colors.line}`,
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 600,
        fontFamily: font,
        padding: "14px 22px",
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {children}
    </Button>
  );
}

type ShellProps = { preview: string; children: ReactNode; logoSrc?: string };

export function EmailShell({ preview, children, logoSrc = `cid:${LOGO_CID}` }: ShellProps) {
  const footer: CSSProperties = { margin: "0 0 6px", fontSize: 12, lineHeight: "18px", color: colors.soft, fontFamily: font };
  const footerLink: CSSProperties = { color: colors.muted, textDecoration: "none" };
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: colors.surface, fontFamily: font, color: colors.ink }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px" }}>
          <Section style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 20 }}>
            <Section style={{ padding: "28px 36px 20px" }}>
              <Img
                src={logoSrc}
                width="120"
                height="67"
                alt="SerenEdge"
                style={{ display: "block", color: colors.accent, fontSize: 20, fontWeight: 700, fontFamily: font }}
              />
            </Section>
            <Hr style={{ borderColor: colors.line, margin: 0 }} />
            <Section style={{ padding: "32px 36px 36px" }}>{children}</Section>
          </Section>
          <Section style={{ padding: "24px 12px 0", textAlign: "center" }}>
            <Text style={footer}>SerenEdge · for each node.</Text>
            <Text style={footer}>
              <Link href="mailto:sales@serenedge.com" style={footerLink}>
                sales@serenedge.com
              </Link>
              {" · "}
              <Link href="tel:+94704888440" style={footerLink}>
                +94 70 488 8440
              </Link>
              {" · "}
              <Link href="https://serenedge.com" style={footerLink}>
                serenedge.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
