import { Column, Heading, Link, Row, Section, Text } from "@react-email/components";
import { colors, EmailButton, EmailShell, multiline, styles } from "./components/EmailShell";

export type TeamNotificationProps = {
  name: string;
  firstName: string;
  email: string;
  phone: string;
  company: string;
  topicLabel: string;
  message: string;
  submittedAt: string;
  replyHref: string;
  logoSrc?: string;
};

export default function TeamNotification(p: TeamNotificationProps) {
  const rows: [string, React.ReactNode][] = [
    ["Name", p.name],
    ["Email", <Link key="e" href={`mailto:${p.email}`} style={{ color: colors.accent }}>{p.email}</Link>],
    ...(p.phone ? ([["Phone", p.phone]] as [string, React.ReactNode][]) : []),
    ...(p.company ? ([["Company", p.company]] as [string, React.ReactNode][]) : []),
    ["Topic", p.topicLabel],
    ["Submitted", p.submittedAt],
  ];
  const tel = p.phone.replace(/[^\d+]/g, "");

  return (
    <EmailShell preview={`${p.name} wants to talk about ${p.topicLabel}.`} logoSrc={p.logoSrc}>
      <Text style={styles.eyebrow}>New enquiry</Text>
      <Heading as="h1" style={styles.h1}>{`${p.name} wants to talk about ${p.topicLabel}`}</Heading>
      <Text style={styles.body}>Reply straight from this email: the Reply button and your mail app&apos;s Reply both go to the client.</Text>

      <Section style={{ margin: "0 0 28px" }}>
        <Row>
          <Column style={{ paddingRight: 8, width: "1%", whiteSpace: "nowrap" }}>
            <EmailButton href={p.replyHref}>{`Reply to ${p.firstName}`}</EmailButton>
          </Column>
          {tel && (
            <Column>
              <EmailButton href={`tel:${tel}`} variant="secondary">{`Call ${p.phone}`}</EmailButton>
            </Column>
          )}
        </Row>
      </Section>

      <Section style={styles.box}>
        {rows.map(([label, value]) => (
          <Row key={label}>
            <Column style={{ width: 110, verticalAlign: "top" }}>
              <Text style={styles.label}>{label}</Text>
            </Column>
            <Column>
              <Text style={styles.value}>{value}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Text style={styles.eyebrow}>Message</Text>
      <Text style={styles.quote}>{multiline(p.message)}</Text>
    </EmailShell>
  );
}

TeamNotification.PreviewProps = {
  name: "Jane Smith",
  firstName: "Jane",
  email: "jane@company.com",
  phone: "+94 71 234 5678",
  company: "Green Acres",
  topicLabel: "IoT Projects",
  message: "We run 40 greenhouses.\nWe'd like live humidity readings and alerts.",
  submittedAt: "27 Sept 2026, 14:05 (Sri Lanka)",
  replyHref: "mailto:jane@company.com?subject=Re%3A%20Your%20SerenEdge%20enquiry",
  logoSrc: "/static/logo-email.png",
} satisfies TeamNotificationProps;
