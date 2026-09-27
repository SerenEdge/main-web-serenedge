import { PageTransition } from "@/components/motion/PageTransition";

// template.tsx re-mounts on every navigation, which is what drives the curtain.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
