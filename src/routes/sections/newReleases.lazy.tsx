import { Section } from "@/components/containers/section";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/sections/newReleases")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Section title="New Releases" dataToFetch="newReleases" />;
}
