import { Section } from '@/components/containers/section'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/sections/mostAnticipated')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Section title="Most Anticipated" dataToFetch="mostAnticipated" />
}
