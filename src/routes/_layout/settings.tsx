import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Users, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_layout/settings")({
  component: SettingsPage,
});

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-semibold">
      {children}
    </label>
  );
}

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("id");
  const [timezone, setTimezone] = useState("Asia/Jakarta");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (currentUser) {
        setFullName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "");
        setEmail(currentUser.email || "");
        setPhone(currentUser.user_metadata?.phone || currentUser.phone || "");
        setLanguage(currentUser.user_metadata?.language || "id");
        setTimezone(currentUser.user_metadata?.timezone || "Asia/Jakarta");
      }
    } catch (err) {
      console.error("Gagal memuat profil user:", err);
      toast.error("Gagal memuat profil pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
          language: language,
          timezone: timezone,
        },
      });
      if (error) throw error;
      toast.success("Profil akun berhasil diperbarui!");
      await loadUserProfile();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Gagal memperbarui profil:", err);
      toast.error(errorMsg || "Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-sans font-bold text-2xl text-ink">Workspace Settings</h2>
        <p className="text-xs text-ink-soft mt-1">
          Configure personal account fields and team permissions.
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        {/* Tab trigger headers */}
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-2 flex w-fit gap-1">
          <TabsTrigger
            value="account"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Settings className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> Account
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Shield className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} /> Team
          </TabsTrigger>
        </TabsList>

        {/* Tab Content 1: Account Settings */}
        <TabsContent value="account" className="pt-6 space-y-5 max-w-xl text-xs">
          {/* Profile */}
          <div className="rounded-2xl border border-rule/45 p-6 bg-slate-50/40 space-y-5">
            <div className="flex items-center gap-2 pb-1 border-b border-rule/30">
              <Settings className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h4 className="font-sans font-semibold text-sm text-ink">Profil Akun</h4>
            </div>

            {/* Avatar + name row */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-xl text-primary shrink-0">
                {getInitials(fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink">{fullName || "User"}</p>
                <p className="text-[10px] text-ink-soft">{email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Full Name</FieldLabel>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Phone Number</FieldLabel>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62..."
                  className="bg-white rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <FieldLabel>Email Address</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-slate-100 rounded-xl text-ink-soft cursor-not-allowed border border-rule/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Language</FieldLabel>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full bg-white rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Timezone</FieldLabel>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-full bg-white rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Jakarta">WIB — Asia/Jakarta</SelectItem>
                    <SelectItem value="Asia/Makassar">WITA — Asia/Makassar</SelectItem>
                    <SelectItem value="Asia/Jayapura">WIT — Asia/Jayapura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleSaveAccount}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-2 font-medium text-xs flex items-center gap-1.5"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {saving ? "Saving Changes..." : "Save Account Changes"}
            </Button>
          </div>
        </TabsContent>

        {/* Tab Content 3: Team Access */}
        <TabsContent value="security" className="pt-6 space-y-6 max-w-2xl text-xs">
          <div className="rounded-2xl border border-rule/45 p-6 bg-slate-50/40 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="font-sans font-bold text-base text-ink">Team Seat Logs</h3>
              </div>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs rounded-xl font-medium"
              >
                + Invite Member
              </Button>
            </div>

            {/* Team table list */}
            <div className="overflow-hidden rounded-xl border border-rule/45 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="font-mono text-[9px] uppercase tracking-widest text-ink-soft bg-slate-50/65">
                    <TableHead>Name</TableHead>
                    <TableHead>Workspace Role</TableHead>
                    <TableHead className="text-right">Access Token Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-sans font-semibold text-sm text-ink">
                      {fullName || "User"} (You)
                    </TableCell>
                    <TableCell className="font-mono text-ink-soft">Owner</TableCell>
                    <TableCell className="text-right font-mono text-ink-soft">All access</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
