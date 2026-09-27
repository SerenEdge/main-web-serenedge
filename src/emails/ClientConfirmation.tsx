import { Column, Heading, Hr, Row, Section, Text } from "@react-email/components";
import { colors, EmailButton, EmailShell, multiline, styles } from "./components/EmailShell";

export type ClientConfirmationProps = {
  firstName: string;
  topicLabel: string;
  company: string;
  message: string;
  logoSrc?: string;
};

const STEPS = [
  "We read your message and reply within 24 hours to set up the call.",
  "We meet for a free 90-minute discovery call. You talk, we map.",
  "Within a week you get a problem doc and a scope. Still free.",
];

export default function ClientConfirmation({ firstName, topicLabel, company, message, logoSrc }: ClientConfirmationProps) {
  return (
    <EmailShell preview="Thanks for reaching out. We'll be in touch within 24 hours." logoSrc={logoSrc}>
      <Text style={styles.eyebrow}>Message received</Text>
      <Heading as="h1" style={styles.h1}>{`Thanks, ${firstName}.`}</Heading>
      <Text style={styles.body}>
        We&apos;ll be in touch within 24 hours to set up your discovery call. Every message is read personally, never by a bot.
      </Text>

      <Section style={styles.box}>
        <Text style={styles.label}>Your message</Text>
        <Text style={styles.value}>{company ? `${topicLabel} · ${company}` : topicLabel}</Text>
        <Text style={styles.quote}>{multiline(message)}</Text>
      </Section>

      <Text style={styles.eyebrow}>What happens next</Text>
      {STEPS.map((step, i) => (
        <Row key={step} style={{ marginBottom: 10 }}>
          <Column style={{ width: 32, verticalAlign: "top" }}>
            <Text
              style={{
                margin: 0,
                width: 24,
                height: 24,
                lineHeight: "24px",
                borderRadius: 12,
                backgroundColor: colors.ink,
                color: colors.white,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {String(i + 1)}
            </Text>
          </Column>
          <Column>
            <Text style={{ margin: 0, fontSize: 15, lineHeight: "24px", color: colors.ink }}>{step}</Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: colors.line, margin: "28px 0" }} />
      <Text style={styles.body}>Prefer to talk? We take direct calls.</Text>
      <EmailButton href="tel:+94704888440" variant="secondary">
        Call +94 70 488 8440
      </EmailButton>
      <Text style={{ ...styles.body, margin: "28px 0 0", color: colors.ink }}>The SerenEdge team</Text>
    </EmailShell>
  );
}

ClientConfirmation.PreviewProps = {
  firstName: "Jane",
  topicLabel: "IoT Projects",
  company: "Green Acres",
  message: "We run 40 greenhouses.\nWe'd like live humidity readings and alerts.",
  logoSrc: "/static/logo-email.png",
} satisfies ClientConfirmationProps;
