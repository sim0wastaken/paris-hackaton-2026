import { EmptyState } from "@/components/empty-state";

export default function CreativesPage() {
  return (
    <EmptyState eyebrow="Blocked" title="Creatives unlock after approved ad groups.">
      <p className="max-w-2xl text-sm leading-6 text-[#66706b]">
        Spec 07 will generate title, description, creative angle, and asset
        prompts from approved ad groups.
      </p>
    </EmptyState>
  );
}
