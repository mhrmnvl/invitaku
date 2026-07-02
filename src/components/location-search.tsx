import * as React from "react";
import { Search, MapPin, Loader2, X, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SelectedLocation {
  country: string;
  province: string;
  city: string;
  district: string;
  latitude: string;
  longitude: string;
  timezone: string;
}

interface LocationSearchProps {
  onSelect: (location: SelectedLocation) => void;
  onClear: () => void;
  value?: SelectedLocation | null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    country?: string;
    state?: string;
    province?: string;
    city?: string;
    regency?: string;
    county?: string;
    municipality?: string;
    suburb?: string;
    district?: string;
    village?: string;
    town?: string;
  };
}

function getTimezoneFromProvince(provinceName: string): string {
  const prov = provinceName.toLowerCase();

  // WITA Provinces
  if (
    prov.includes("sulawesi") ||
    prov.includes("gorontalo") ||
    prov.includes("nusa tenggara") ||
    prov.includes("bali") ||
    prov.includes("kalimantan selatan") ||
    prov.includes("kalimantan timur") ||
    prov.includes("kalimantan utara")
  ) {
    return "Asia/Makassar";
  }

  // WIT Provinces
  if (prov.includes("maluku") || prov.includes("papua")) {
    return "Asia/Jayapura";
  }

  // Default to WIB (Asia/Jakarta)
  return "Asia/Jakarta";
}

export function LocationSearch({ onSelect, onClear, value }: LocationSearchProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<NominatimResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Debounced search
  React.useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query,
          )}&format=json&addressdetails=1&limit=5&countrycodes=id`,
          {
            headers: {
              "User-Agent": "Invitaku-Event-Planner-App",
            },
          },
        );
        if (response.ok) {
          const data: NominatimResult[] = await response.json();
          setResults(data);
          setOpen(true);
        }
      } catch (error) {
        console.error("Error fetching locations from Nominatim:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (item: NominatimResult) => {
    const address = item.address;
    const country = address.country || "Indonesia";
    const province = address.state || address.province || "";
    const city = address.city || address.regency || address.county || address.municipality || "";
    const district = address.suburb || address.district || address.village || address.town || "";

    const selected: SelectedLocation = {
      country,
      province,
      city,
      district,
      latitude: item.lat,
      longitude: item.lon,
      timezone: getTimezoneFromProvince(province),
    };

    onSelect(selected);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  if (value) {
    return (
      <div className="rounded-xl border border-rule/60 bg-white p-4 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <MapPin className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="font-semibold text-sm text-ink leading-none">
              {value.district || "Kecamatan tidak teridentifikasi"}
            </p>
            <p className="text-[11px] text-ink-soft flex items-center gap-0.5 font-medium leading-none mt-1">
              {value.city && <span>{value.city}</span>}
              {value.province && (
                <span className="before:content-['•'] before:mx-1 before:text-ink-soft/40">
                  {value.province}
                </span>
              )}
              {value.country && (
                <span className="before:content-['•'] before:mx-1 before:text-ink-soft/40">
                  {value.country}
                </span>
              )}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-ink-soft font-mono mt-1.5">
              <Globe className="h-3 w-3 text-ink-soft/70 shrink-0" />
              <span>{value.timezone}</span>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClear}
          className="shrink-0 h-7 w-7 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Cari berdasarkan nama Kecamatan (e.g. Bojongsoang)"
          className="pl-9 h-9 text-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-60 overflow-y-auto">
          {results.map((item, idx) => {
            const address = item.address;
            const prov = address.state || address.province || "";
            const city =
              address.city || address.regency || address.county || address.municipality || "";
            const dist =
              address.suburb || address.district || address.village || address.town || "";

            return (
              <button
                key={idx}
                type="button"
                className="w-full text-left rounded-sm px-2.5 py-2 text-xs hover:bg-accent hover:text-accent-foreground flex items-start gap-2 select-none"
                onClick={() => handleSelect(item)}
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{dist || "Kecamatan / Area"}</p>
                  <p className="text-[10px] text-ink-soft truncate">
                    {[city, prov, address.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && results.length === 0 && query.trim().length >= 3 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-center text-xs text-muted-foreground shadow-md">
          Lokasi tidak ditemukan. Coba ketik dengan ejaan yang berbeda.
        </div>
      )}
    </div>
  );
}
