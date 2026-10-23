import {
  Bell,
  Boxes,
  Check,
  Database,
  FileText,
  Layers,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { ChoiceCards, Disclosure, Field, NumberInput, SwitchField } from "@/ui/form";
import { notify } from "@/ui/notify";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Badge } from "@/ui/primitives/badge";
import { Button, IconButton } from "@/ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { ScrollArea } from "@/ui/primitives/scroll-area";
import { Select } from "@/ui/primitives/select";
import { Separator } from "@/ui/primitives/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/ui/primitives/sheet";
import { Skeleton } from "@/ui/primitives/skeleton";
import { Switch } from "@/ui/primitives/switch";
import { Table, TableBody, TableCell, TableRow } from "@/ui/primitives/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/primitives/tabs";
import { Textarea } from "@/ui/primitives/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/primitives/tooltip";
import { StatusBadge, StatusDot } from "@/ui/status";

const STATES = ["running", "starting", "reconnecting", "degraded", "failed", "stopped"];
const VARIANTS = ["default", "secondary", "outline", "ghost", "destructive"] as const;
const BADGE_VARIANTS = ["default", "outline", "live", "warn", "danger", "solid"] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Every primitive in the registry, on one page, so a change can be seen in the browser. */
export function PrimitivesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("details");
  const [checked, setChecked] = useState(true);
  const [notifyState, setNotifyState] = useState(false);
  const [count, setCount] = useState(4);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [advanced, setAdvanced] = useState(1024);

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Primitives"
        title="Components"
        description="The shadcn/new-york set these starters share, with the app's own additions."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Section
          title="Buttons"
          description="An icon, a spinner, or both, with the label unchanged."
        >
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Add">
                <Plus />
              </Button>
              <IconButton icon={RefreshCw} label="Refresh" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button icon={Plus} onClick={() => notify.created("Item")}>
                With icon
              </Button>
              <Button loading>Saving…</Button>
              <Button icon={Check} loading>
                Saving
              </Button>
              <Button disabled>Disabled</Button>
              <Button asChild variant="secondary">
                <a href="#primitives">A slotted link</a>
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="Badges and status"
          description="Status is text plus a colour, never colour alone."
        >
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {BADGE_VARIANTS.map((variant) => (
                <Badge key={variant} variant={variant}>
                  {variant}
                </Badge>
              ))}
            </div>
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              {STATES.map((state) => (
                <span
                  key={state}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <StatusDot state={state} />
                  {state}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATES.map((state) => (
                <StatusBadge key={state} state={state} />
              ))}
            </div>
          </div>
        </Section>

        <Section title="Fields" description="Inset controls with one shared focus treatment.">
          <div className="grid gap-4">
            <Field label="Name" hint="Shown in lists and the palette.">
              <Input placeholder="Nightly ingest" />
            </Field>
            <Field label="Owner" error="Pick an owner before saving.">
              <Input defaultValue="" placeholder="Platform" />
            </Field>
            <Field label="Region">
              <Select defaultValue="eu" aria-label="Region">
                <option value="us">United States</option>
                <option value="eu">Europe</option>
                <option value="ap">Asia Pacific</option>
              </Select>
            </Field>
            <Field label="Notes">
              <Textarea placeholder="Anything the next person should know" aria-label="Notes" />
            </Field>
            <div className="flex items-center gap-3">
              <Switch id="retain" checked={checked} onCheckedChange={setChecked} />
              <Label htmlFor="retain">Retain history after a stop</Label>
            </div>
          </div>
        </Section>

        <Section
          title="Form controls"
          description="The four the starters add on top of the fields."
        >
          <div className="grid gap-4">
            <Field label="Workers">
              <NumberInput
                value={count}
                onChange={setCount}
                min={1}
                max={16}
                aria-label="Workers"
              />
            </Field>
            <SwitchField
              checked={notifyState}
              onCheckedChange={setNotifyState}
              label="Notify on state changes"
              description="A toast whenever an item starts, stops or fails."
            />
            <Disclosure title="Advanced">
              <Field label="Buffer size">
                <NumberInput
                  value={advanced}
                  onChange={setAdvanced}
                  min={128}
                  max={65536}
                  aria-label="Buffer size"
                />
              </Field>
            </Disclosure>
            <ChoiceCards
              value={mode}
              onChange={setMode}
              options={[
                {
                  id: "single",
                  label: "One at a time",
                  description: "Each item runs on its own.",
                  icon: <FileText />,
                },
                {
                  id: "bulk",
                  label: "Bulk",
                  description: "Many items share a schedule.",
                  icon: <Layers />,
                },
              ]}
            />
          </div>
        </Section>

        <Section title="Overlays" description="Dialog, sheet, dropdown and tooltip.">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              Open dialog
            </Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Open sheet
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" icon={Settings}>
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Row actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => notify.success("Restarted")}>
                  <RefreshCw className="size-4" />
                  Restart
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => notify.success("Copied")}>
                  <Layers className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => notify.deleted("Item")}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Tooltips need no provider of their own here.
              </TooltipContent>
            </Tooltip>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename item</DialogTitle>
                <DialogDescription>The name is used everywhere the item appears.</DialogDescription>
              </DialogHeader>
              <Field label="Name">
                <Input defaultValue="Nightly ingest" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  icon={Check}
                  onClick={() => {
                    setDialogOpen(false);
                    notify.saved("Item");
                  }}
                >
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right" className="w-80 p-5">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription className="mt-1">
                The same panel as the mobile sidebar, on the other side.
              </SheetDescription>
              <p className="mt-4 text-sm text-muted-foreground">
                A sheet is a dialog that slides in from an edge.
              </p>
            </SheetContent>
          </Sheet>
        </Section>

        <Section
          title="Tabs, table and placeholders"
          description="Dense rows, and what shows while data loads."
        >
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-40 text-muted-foreground">Region</TableCell>
                    <TableCell>Europe</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Owner</TableCell>
                    <TableCell>Platform</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="history">
              <div className="grid gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </TabsContent>
          </Tabs>
          <Separator className="my-4" />
          <ScrollArea className="h-28 rounded-lg bg-inset shadow-[var(--shadow-border)]">
            <div className="grid gap-2 p-3 text-sm">
              {[
                "Login",
                "Item created",
                "Worker started",
                "Destination connected",
                "Item stopped",
              ].map((line) => (
                <span key={line} className="text-muted-foreground">
                  {line}
                </span>
              ))}
            </div>
          </ScrollArea>
        </Section>

        <Section title="Toasts" description="One set of words for every page, from notify.">
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={Bell} onClick={() => notify.success("Something went right")}>
              success
            </Button>
            <Button variant="secondary" onClick={() => notify.created("Item")}>
              created
            </Button>
            <Button variant="secondary" onClick={() => notify.saved("Settings")}>
              saved
            </Button>
            <Button variant="secondary" onClick={() => notify.deleted("Item")}>
              deleted
            </Button>
            <Button variant="secondary" onClick={() => notify.copied()}>
              copied
            </Button>
            <Button
              variant="destructive"
              onClick={() => notify.error(new Error("The API is not reachable"))}
            >
              error
            </Button>
          </div>
        </Section>

        <Section
          title="Icons"
          description="The lucide icons the pages use, at the size they use them."
        >
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <Sparkles className="size-4" />
            <Boxes className="size-4" />
            <Server className="size-4" />
            <Database className="size-4" />
            <Layers className="size-4" />
            <FileText className="size-4" />
            <Settings className="size-4" />
            <RefreshCw className="size-4" />
          </div>
        </Section>
      </div>
    </PageShell>
  );
}
