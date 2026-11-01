import { ThemeShell } from "@/components/shell/theme-shell";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeShell>{children}</ThemeShell>;
}
