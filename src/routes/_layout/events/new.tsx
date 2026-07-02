import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { createEvent, createEventSchema } from "@/lib/events-api";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LocationSearch } from "@/components/location-search";
import { MapPicker } from "@/components/map-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_layout/events/new")({
  component: CreateEventPage,
});

const formSchema = createEventSchema.extend({
  location_provider: z
    .object({
      country: z.string(),
      province: z.string(),
      city: z.string(),
      district: z.string(),
      latitude: z.string(),
      longitude: z.string(),
      timezone: z.string(),
    })
    .nullable()
    .optional(),
  venueName: z.string().min(1, "Nama tempat / venue wajib diisi"),
  addressDetail: z.string().min(1, "Detail alamat wajib diisi"),
  village: z.string().optional(),
  locationNote: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function CreateEventPage() {
  const router = useRouter();
  const navigate = Route.useNavigate();

  const parseLocalDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return undefined;
    const parsed = new Date(dateStr + "T00:00:00");
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      type: "Wedding",
      description: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      start_time: "10:00",
      end_time: "12:00",
      timezone: "Asia/Jakarta",
      location: "",
      maps_url: "",
      cover_image: "",
      theme_color: "#1B4D3E",
      visibility: "Public",
      password: "",
      location_provider: null,
      venueName: "",
      addressDetail: "",
      village: "",
      locationNote: "",
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const handleNext = async () => {
    let fieldsToValidate: Array<keyof FormValues> = [];
    if (currentStep === 1) {
      fieldsToValidate = ["name", "slug", "type", "description"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["start_date", "end_date", "start_time", "end_time", "timezone"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["location_provider", "venueName", "addressDetail"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Harap isi semua kolom wajib (*) dengan benar sebelum melanjutkan.");
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const eventName = watch("name");
  const visibility = watch("visibility");

  const locationProvider = watch("location_provider");
  const venueName = watch("venueName");
  const addressDetail = watch("addressDetail");
  const village = watch("village");

  const getCombinedAddressPreview = () => {
    const details = [venueName, addressDetail, village ? `Kel. ${village}` : null]
      .filter(Boolean)
      .join(" ");

    const region = [
      locationProvider?.district,
      locationProvider?.city,
      locationProvider?.province,
      locationProvider?.country,
    ]
      .filter(Boolean)
      .join(", ");

    if (!details && !region) return "Belum ada alamat yang dimasukkan.";
    if (!details) return region;
    if (!region) return details;
    return `${details}, ${region}`;
  };

  // Auto-generate slug from name if untouched
  useEffect(() => {
    if (eventName) {
      const generatedSlug = eventName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", generatedSlug);
    }
  }, [eventName, setValue]);

  const handleCreateSubmit = async (
    values: FormValues,
    status: "Draft" | "Published" = "Published",
  ) => {
    try {
      const locationData = {
        country: values.location_provider?.country || "",
        province: values.location_provider?.province || "",
        city: values.location_provider?.city || "",
        district: values.location_provider?.district || "",
        latitude: values.location_provider?.latitude || "",
        longitude: values.location_provider?.longitude || "",
        timezone: values.location_provider?.timezone || values.timezone || "Asia/Jakarta",
        venueName: values.venueName,
        addressDetail: values.addressDetail,
        village: values.village || "",
        locationNote: values.locationNote || "",
      };

      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        type: values.type,
        start_date: values.start_date,
        end_date: values.end_date,
        start_time: values.start_time,
        end_time: values.end_time,
        timezone: locationData.timezone, // Sync timezone from location
        location: JSON.stringify(locationData),
        maps_url: values.maps_url,
        cover_image: values.cover_image,
        theme_color: values.theme_color,
        visibility: values.visibility,
        password: values.password,
        status,
      };

      await createEvent({ data: payload });
      toast.success(
        status === "Draft" ? "Event draft saved successfully!" : "Event created successfully!",
      );
      reset();
      router.invalidate();
      // Redirect back to list
      navigate({ to: "/events" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save event";
      toast.error(message);
    }
  };

  const renderFormNavigation = () => (
    <>
      <Separator className="bg-rule/30 my-4" />
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-xs h-9 px-3 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            asChild
            className="text-xs h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            <Link to="/events">Cancel</Link>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleSubmit((vals) => handleCreateSubmit(vals as FormValues, "Draft"))}
            className="text-xs h-9 px-4 hover:bg-muted transition-colors"
          >
            Save Draft
          </Button>
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 text-xs h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Lanjutkan
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          )}
        </div>
      </div>
    </>
  );

  const eventTypes = [
    "Wedding",
    "Birthday",
    "Graduation",
    "Seminar",
    "Corporate",
    "Community",
    "School",
    "Government",
    "Other",
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl text-ink font-semibold">Create Event</h2>
          <p className="text-xs text-ink-soft">
            Set up details and path for your digital invitation.
          </p>
        </div>
      </div>

      <div className="bg-white border border-rule/50 rounded-2xl p-5 shadow-xs">
        <div className="relative flex items-center justify-between w-full max-w-lg mx-auto">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-rule z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary transition-all duration-300 z-0"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />

          {[
            { step: 1, label: "Informasi Dasar", desc: "Detail nama & tipe" },
            { step: 2, label: "Waktu & Tanggal", desc: "Penjadwalan event" },
            { step: 3, label: "Lokasi Event", desc: "Alamat & peta" },
            { step: 4, label: "Akses & Privasi", desc: "Pengaturan keamanan" },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;

            return (
              <div key={item.step} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (item.step < currentStep) {
                      setCurrentStep(item.step);
                    } else if (item.step > currentStep) {
                      let isValid = true;
                      for (let s = currentStep; s < item.step; s++) {
                        let fields: Array<keyof FormValues> = [];
                        if (s === 1) fields = ["name", "slug", "type", "description"];
                        if (s === 2)
                          fields = ["start_date", "end_date", "start_time", "end_time", "timezone"];
                        if (s === 3)
                          fields = [
                            "location_provider",
                            "venueName",
                            "addressDetail",
                            "village",
                            "locationNote",
                          ];
                        const stepValid = await trigger(fields);
                        if (!stepValid) {
                          isValid = false;
                          setCurrentStep(s);
                          break;
                        }
                      }
                      if (isValid) {
                        setCurrentStep(item.step);
                      }
                    }
                  }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-all duration-300 shadow-xs",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                        ? "bg-white border-primary text-primary ring-4 ring-primary/10"
                        : "bg-white border-rule text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : item.step}
                </button>
                <div className="absolute top-10 flex flex-col items-center text-center w-28">
                  <span
                    className={cn(
                      "text-[10px] font-semibold transition-colors duration-200 leading-tight",
                      isActive ? "text-primary font-bold" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-6" />
      </div>

      <form
        onSubmit={handleSubmit((vals) => handleCreateSubmit(vals as FormValues, "Published"))}
        className="space-y-6"
      >
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="rounded-2xl border border-rule/50 bg-white p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-ink tracking-tight">Basic Information</h3>
              <p className="text-xs text-ink-soft">General details of your invitation event.</p>
            </div>
            <Separator className="bg-rule/40" />
            <div className="space-y-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Amara & Reza Wedding"
                  {...register("name")}
                />
                {errors.name && (
                  <span className="text-destructive text-[10px]">{errors.name.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug">Slug / Link Path *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm font-medium">/invite/</span>
                  <Input
                    id="slug"
                    type="text"
                    placeholder="slug-path"
                    {...register("slug")}
                    className="flex-1"
                  />
                </div>
                {errors.slug && (
                  <span className="text-destructive text-[10px]">{errors.slug.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Event Type *</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full text-xs h-9 bg-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        {eventTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event details..."
                  {...register("description")}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            {renderFormNavigation()}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {currentStep === 2 && (
          <div className="rounded-2xl border border-rule/50 bg-white p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-ink tracking-tight">Date & Time</h3>
              <p className="text-xs text-ink-soft">Configure when your event takes place.</p>
            </div>
            <Separator className="bg-rule/40" />
            <div className="space-y-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <Label>Timezone</Label>
                <div className="h-9 px-3 border border-rule/40 rounded-lg bg-muted/30 flex items-center text-xs font-mono text-muted-foreground select-none">
                  {watch("timezone") || "Asia/Jakarta"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Start Date *</Label>
                  <Controller
                    control={control}
                    name="start_date"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal text-xs h-9 bg-white px-3 border border-rule",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {field.value ? (
                              format(parseLocalDate(field.value)!, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseLocalDate(field.value)}
                            onSelect={(date) =>
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.start_date && (
                    <span className="text-destructive text-[10px]">
                      {errors.start_date.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>End Date</Label>
                  <Controller
                    control={control}
                    name="end_date"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal text-xs h-9 bg-white px-3 border border-rule",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {field.value ? (
                              format(parseLocalDate(field.value)!, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseLocalDate(field.value)}
                            onSelect={(date) =>
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input id="start_time" type="time" {...register("start_time")} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input id="end_time" type="time" {...register("end_time")} />
                </div>
              </div>
            </div>
            {renderFormNavigation()}
          </div>
        )}

        {/* Step 3: Location Details */}
        {currentStep === 3 && (
          <div className="rounded-2xl border border-rule/50 bg-white p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-ink tracking-tight">Location Details</h3>
              <p className="text-xs text-ink-soft">
                Cari lokasi Kecamatan dan lengkapi detail alamat secara manual.
              </p>
            </div>
            <Separator className="bg-rule/40" />
            <div className="space-y-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <Label>Cari Wilayah (Sampai Kecamatan) *</Label>
                <Controller
                  control={control}
                  name="location_provider"
                  render={({ field }) => (
                    <div className="space-y-4">
                      <LocationSearch
                        value={field.value}
                        onSelect={(loc) => {
                          field.onChange(loc);
                          if (loc.timezone) {
                            setValue("timezone", loc.timezone);
                          }
                          if (loc.latitude && loc.longitude) {
                            setValue(
                              "maps_url",
                              `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`,
                            );
                          }
                        }}
                        onClear={() => {
                          field.onChange(null);
                          setValue("maps_url", "");
                        }}
                      />
                      {field.value && (
                        <>
                          <div className="rounded-xl border border-rule bg-white p-3.5 flex items-center justify-between gap-4 shadow-sm hover:border-primary/40 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                <MapPin className="h-4.5 w-4.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-foreground">
                                  Peta Lokasi Presisi
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                                  {field.value.latitude && field.value.longitude
                                    ? "Pin koordinat telah disetel"
                                    : "Disarankan: atur pin koordinat peta"}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsMapExpanded(true)}
                              className="shrink-0 text-xs h-8 px-3"
                            >
                              Atur Pin Peta
                            </Button>
                          </div>

                          {/* Interactive Map Dialog Modal */}
                          <Dialog open={isMapExpanded} onOpenChange={setIsMapExpanded}>
                            <DialogContent className="max-w-2xl sm:rounded-2xl p-6">
                              <DialogHeader>
                                <DialogTitle className="text-sm font-semibold text-ink">
                                  Tentukan Lokasi Presisi
                                </DialogTitle>
                                <DialogDescription className="text-xs text-ink-soft">
                                  Geser marker merah atau klik di mana saja pada peta untuk menandai
                                  titik lokasi event secara tepat.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <MapPicker
                                  latitude={field.value.latitude}
                                  longitude={field.value.longitude}
                                  onChange={(newLat, newLon) => {
                                    field.onChange({
                                      ...field.value!,
                                      latitude: newLat,
                                      longitude: newLon,
                                    });
                                    setValue(
                                      "maps_url",
                                      `https://www.google.com/maps/search/?api=1&query=${newLat},${newLon}`,
                                    );
                                  }}
                                />
                              </div>
                              <div className="flex justify-end pt-2">
                                <Button
                                  type="button"
                                  onClick={() => setIsMapExpanded(false)}
                                  className="text-xs h-9 px-4"
                                >
                                  Selesai
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="venueName">Nama Tempat / Venue *</Label>
                <Input
                  id="venueName"
                  type="text"
                  placeholder="e.g. Gedung Bidakara, Rumah Mempelai, Ballroom Orchid"
                  autoComplete="off"
                  {...register("venueName")}
                />
                {errors.venueName && (
                  <span className="text-destructive text-[10px]">{errors.venueName.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="addressDetail">
                  Detail Alamat (Jalan, Kp., RT/RW, Desa, Patokan, dll) *
                </Label>
                <Textarea
                  id="addressDetail"
                  placeholder="Contoh: Kp. Bojong, RT 01/RW 02, Desa Lengkong, Sebelah Alfamart"
                  autoComplete="off"
                  className="min-h-[90px]"
                  {...register("addressDetail")}
                />
                {errors.addressDetail && (
                  <span className="text-destructive text-[10px]">
                    {errors.addressDetail.message}
                  </span>
                )}
              </div>

              {/* Stripe-Style Address Card Preview */}
              <div className="rounded-xl border border-rule bg-slate-50/50 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <MapPin className="h-4 w-4" />
                  <span>Event Location</span>
                </div>
                <div className="text-muted-foreground leading-relaxed font-medium text-xs">
                  {venueName ? (
                    <span className="text-foreground font-semibold">{venueName}</span>
                  ) : (
                    <span className="text-muted-foreground/60 italic">Nama tempat belum diisi</span>
                  )}
                  {" - "}
                  {addressDetail ? (
                    <span>{addressDetail}</span>
                  ) : (
                    <span className="text-muted-foreground/60 italic">
                      Detail alamat belum diisi
                    </span>
                  )}
                  {locationProvider && (
                    <>
                      {", "}
                      <span>
                        {[
                          locationProvider.district,
                          locationProvider.city,
                          locationProvider.province,
                          locationProvider.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Maps URL Status Display */}
              {locationProvider && watch("maps_url") && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium pt-1">
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Location Selected</span>
                  <span className="text-muted-foreground/30">•</span>
                  <a
                    href={watch("maps_url") || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold flex items-center gap-1.5"
                  >
                    View on Google Maps
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
            {renderFormNavigation()}
          </div>
        )}

        {/* Step 4: Access & Security */}
        {currentStep === 4 && (
          <div className="rounded-2xl border border-rule/50 bg-white p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-ink tracking-tight">Access & Security</h3>
              <p className="text-xs text-ink-soft">Control who can access your invitation page.</p>
            </div>
            <Separator className="bg-rule/40" />
            <div className="space-y-5 text-xs">
              <div className="flex flex-col gap-1.5">
                <Label>Visibility *</Label>
                <Controller
                  control={control}
                  name="visibility"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full text-xs h-9 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Password">Password Protected</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {visibility === "Password" && (
                <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password akses"
                    {...register("password", { required: visibility === "Password" })}
                  />
                  {errors.password && (
                    <span className="text-destructive text-[10px]">{errors.password.message}</span>
                  )}
                </div>
              )}
            </div>
            {renderFormNavigation()}
          </div>
        )}
      </form>
    </div>
  );
}
