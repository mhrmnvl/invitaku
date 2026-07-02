import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getEventById } from "@/lib/events-api";

export const Route = createFileRoute("/_layout/events/$eventId")({
  loader: async ({ params }) => {
    const event = await getEventById({ data: params.eventId });
    if (!event) {
      throw new Error("Acara tidak ditemukan");
    }
    return { event };
  },
  component: EventLayout,
});

function EventLayout() {
  return <Outlet />;
}
