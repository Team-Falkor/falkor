import { Section } from "@/components/containers/section";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sections/topRated")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Section title="Top Rated" dataToFetch="topRated" />;
}
