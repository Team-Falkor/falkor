import { Downloads } from "@/features/downloads/components/Downloads";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/downloads")({
  component: Downloads,
});
