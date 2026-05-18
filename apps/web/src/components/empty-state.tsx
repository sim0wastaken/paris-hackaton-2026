import { Card, Heading, Kicker, Stack } from "@motive/ds/primitives";

export function EmptyState({
  action,
  children,
  eyebrow,
  title
}: {
  action?: React.ReactNode;
  children?: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <Card as="section" className="empty-state">
      <Stack gap={3}>
        <Kicker tone="muted">{eyebrow}</Kicker>
        <Heading level={4}>{title}</Heading>
        {children ? <div>{children}</div> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </Stack>
    </Card>
  );
}
