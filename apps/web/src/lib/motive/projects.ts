export function getProjectShell(projectId: string) {
  if (projectId !== "demo-project") return null;

  return {
    id: projectId,
    name: "Demo brand workspace",
    stats: [
      { label: "Sources", value: "0" },
      { label: "Extraction runs", value: "0" },
      { label: "Review rows", value: "0" }
    ]
  };
}
