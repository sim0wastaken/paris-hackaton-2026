import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type RealtimeRow = Record<string, unknown> & { id: unknown };

export type ProjectTableSubscription<Table extends string> = {
  channel: string;
  projectId: string;
  tables: readonly Table[];
  onRow: (table: Table, row: RealtimeRow) => void;
  onStatus?: (status: "live" | "polling") => void;
};

export function subscribeToProjectTables<Table extends string>({
  channel: channelName,
  projectId,
  tables,
  onRow,
  onStatus
}: ProjectTableSubscription<Table>): () => void {
  const supabase = createSupabaseBrowserClient();
  let channel = supabase.channel(channelName);
  for (const table of tables) {
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `project_id=eq.${projectId}` },
      (payload) => {
        const row = payload.new;
        if (row && typeof row === "object" && "id" in row) {
          onRow(table, row as RealtimeRow);
        }
      }
    );
  }
  channel.subscribe((status) => {
    onStatus?.(status === "SUBSCRIBED" ? "live" : "polling");
  });
  return () => {
    void supabase.removeChannel(channel);
  };
}
