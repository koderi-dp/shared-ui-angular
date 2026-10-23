import { Bell, Database, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Disclosure, Field, NumberInput, SwitchField } from "@/ui/form";
import { notify } from "@/ui/notify";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Input } from "@/ui/primitives/input";
import { SettingsSaveFooter, SettingsSectionLayout } from "@/ui/settings-section";

const SECTIONS = [
  {
    id: "general",
    label: "General",
    description: "Name, workers and defaults",
    icon: SlidersHorizontal,
  },
  { id: "notifications", label: "Notifications", description: "What raises a toast", icon: Bell },
  { id: "storage", label: "Storage", description: "Where data is kept", icon: Database },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

type Form = {
  name: string;
  workers: number;
  notifyOnChange: boolean;
  retentionDays: number;
  path: string;
};

const INITIAL: Form = {
  name: "Showcase",
  workers: 4,
  notifyOnChange: true,
  retentionDays: 30,
  path: "/var/lib/showcase",
};

/** The settings frame: a section list, one form per section, and a footer that knows if it is dirty. */
export function SettingsPage() {
  const [section, setSection] = useState<SectionId>("general");
  const [form, setForm] = useState<Form>(INITIAL);
  const [saved, setSaved] = useState<Form>(INITIAL);
  const [isSaving, setSaving] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dirty) return;
    setSaving(true);
    // A real app would await the API here.
    setTimeout(() => {
      setSaving(false);
      setSaved(form);
      notify.saved("Settings");
    }, 600);
  }

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Configuration"
        title="Settings"
        description="Sections on the left, one form at a time, and a footer that says whether there is anything to save."
      />
      <form
        onSubmit={onSubmit}
        className="flex min-h-[30rem] flex-col overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]"
      >
        <SettingsSectionLayout
          label="Settings sections"
          sections={SECTIONS}
          activeSection={section}
          onSectionChange={setSection}
        >
          {section === "general" ? (
            <div className="grid gap-4">
              <Field label="Name" hint="What the app calls itself.">
                <Input
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  aria-label="Name"
                />
              </Field>
              <Field label="Workers">
                <NumberInput
                  value={form.workers}
                  onChange={(value) => set("workers", value)}
                  min={1}
                  max={16}
                  aria-label="Workers"
                />
              </Field>
              <Disclosure title="Advanced" forceOpen={form.workers > 8}>
                <Field label="Retention" hint="Days of history to keep.">
                  <NumberInput
                    value={form.retentionDays}
                    onChange={(value) => set("retentionDays", value)}
                    min={1}
                    max={365}
                    aria-label="Retention"
                  />
                </Field>
              </Disclosure>
            </div>
          ) : null}

          {section === "notifications" ? (
            <div className="grid gap-4">
              <SwitchField
                checked={form.notifyOnChange}
                onCheckedChange={(value) => set("notifyOnChange", value)}
                label="Toast on every state change"
                description="Off means only failures are announced."
              />
            </div>
          ) : null}

          {section === "storage" ? (
            <div className="grid gap-4">
              <Field label="Data directory" hint="Must be writable by the service.">
                <Input
                  value={form.path}
                  onChange={(event) => set("path", event.target.value)}
                  aria-label="Data directory"
                />
              </Field>
            </div>
          ) : null}
        </SettingsSectionLayout>
        <SettingsSaveFooter
          dirty={dirty}
          isSaving={isSaving}
          submitLabel="Save settings"
          onCancel={() => setForm(saved)}
          note="Saving restarts the workers."
        />
      </form>
    </PageShell>
  );
}
