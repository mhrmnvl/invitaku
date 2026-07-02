import { createFileRoute, useRouter } from "@tanstack/react-router";
import * as React from "react";
import { logPublicInvitationView, submitGuestRsvp, getPublicEventComments } from "@/lib/guests-api";
import { getPublicEventByInvitationSlug } from "@/lib/events-api";

import {
  InvitationTemplateContent,
  COLOR_PALETTES,
  TYPOGRAPHY_PAIRS,
} from "./_layout/events/$eventId/invitations";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$slug")({
  loader: async ({ params }) => {
    const { slug } = params;
    try {
      const data = await getPublicEventByInvitationSlug({ data: slug });
      return data;
    } catch (err: any) {
      throw new Error(err.message || "Gagal memuat undangan.");
    }
  },
  component: PublicInvitePage,
  errorComponent: InviteErrorPage,
});

function PublicInvitePage() {
  const { event, guest } = Route.useLoaderData();
  const { slug } = Route.useParams();

  // Track if invitation is opened (we log this view on mount once)
  React.useEffect(() => {
    logPublicInvitationView({ data: slug }).catch((e) => console.error("Error logging view:", e));
  }, [slug]);

  // Load actual wishes/comments feed dynamically
  const [comments, setComments] = React.useState<any[]>([]);
  const loadComments = React.useCallback(async () => {
    try {
      const list = await getPublicEventComments({ data: event.id });
      setComments(list);
    } catch (e) {
      console.error("Failed to load comments:", e);
    }
  }, [event.id]);

  React.useEffect(() => {
    loadComments();
  }, [loadComments]);

  // States for RSVP form
  const [rsvpName, setRsvpName] = React.useState(guest.name);
  const [rsvpAttendance, setRsvpAttendance] = React.useState("Attending");
  const [rsvpState, setRsvpState] = React.useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [newCommentName, setNewCommentName] = React.useState(guest.name);
  const [newCommentMsg, setNewCommentMsg] = React.useState("");

  // States for lightbox/audio
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = React.useState(false);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr), "EEEE, d MMMM yyyy", { locale: localeId });
    } catch {
      return dateStr;
    }
  };

  const handleRsvpSubmit = async () => {
    setRsvpState("submitting");
    try {
      await submitGuestRsvp({
        data: {
          guestId: guest.id,
          status: rsvpAttendance as "Attending" | "Declined",
          partySize: guest.party_size || 1,
          message: newCommentMsg || null,
        },
      });
      setRsvpState("success");
      toast.success("RSVP Anda berhasil disimpan!");
      // Reload comments/wishes feed
      loadComments();
    } catch (e: any) {
      setRsvpState("error");
      toast.error(e.message || "Gagal mengirimkan RSVP.");
    }
  };

  const handleAddComment = async () => {
    await handleRsvpSubmit();
  };

  // Find configuration styles from settings
  const settings = event.event_settings?.[0] || {};
  const typoPair = TYPOGRAPHY_PAIRS.find((t) => t.id === settings.typo_pair) || TYPOGRAPHY_PAIRS[0];
  const colorPalette =
    COLOR_PALETTES.find((c) => c.id === settings.color_palette) || COLOR_PALETTES[0];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <InvitationTemplateContent
          name={event.name}
          coverImage={event.cover_image}
          themeColor={event.theme_color || colorPalette.primary}
          font={typoPair}
          startDate={event.start_date}
          startTime={event.start_time}
          location={event.location}
          mapsUrl={event.maps_url}
          description={event.description}
          allowRsvp={settings.allow_rsvp}
          allowGuestBook={settings.allow_guest_book}
          allowGallery={settings.allow_gallery}
          allowMusic={settings.allow_music}
          allowComments={settings.allow_comments}
          allowCountdown={settings.allow_countdown}
          allowGift={settings.allow_gift}
          allowStory={settings.allow_story}
          allowQrCode={settings.allow_qr_code}
          storyTimeline={settings.story_timeline}
          giftMethods={settings.gift_methods}
          rsvpName={rsvpName}
          setRsvpName={setRsvpName}
          rsvpAttendance={rsvpAttendance}
          setRsvpAttendance={setRsvpAttendance}
          rsvpState={rsvpState}
          handleRsvpSubmit={handleRsvpSubmit}
          mockComments={comments}
          newCommentName={newCommentName}
          setNewCommentName={setNewCommentName}
          newCommentMsg={newCommentMsg}
          setNewCommentMsg={setNewCommentMsg}
          handleAddComment={handleAddComment}
          isPlayingMusic={isPlayingMusic}
          setIsPlayingMusic={setIsPlayingMusic}
          galleryImages={settings.gallery_images || []}
          setLightboxImage={setLightboxImage}
          formatDate={formatDate}
          colorPalette={colorPalette}
          heroLayout={settings.hero_layout || "classic"}
          galleryLayout={settings.gallery_layout || "grid"}
          sectionStyle={settings.section_style || "rounded"}
          dividerStyle={settings.divider_style || "ornament"}
        />
      </div>

      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <img
            src={lightboxImage}
            alt="Gallery Large"
            className="max-w-full max-h-[90vh] rounded-lg shadow-xl"
          />
        </div>
      )}
    </div>
  );
}

function InviteErrorPage({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-md border border-slate-100 space-y-4">
        <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-serif text-slate-900">Undangan Tidak Aktif</h1>
        <p className="text-sm text-slate-500">
          {error.message || "Tautan undangan ini salah, telah kedaluwarsa, atau dibatalkan."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold tracking-wide transition-colors"
        >
          Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
}
