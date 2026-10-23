import { Download, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { ListFilterBar, SelectionToolbar } from "@/ui/list-filter-bar";
import { notify } from "@/ui/notify";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Button } from "@/ui/primitives/button";
import { Checkbox } from "@/ui/primitives/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";
import { StatusBadge } from "@/ui/status";
import { formatBytes } from "@/ui/utils";
import { demoItems } from "../data";

/** The furniture around a list page: header, filter bar, selection toolbar, confirm step. */
export function BlocksPage() {
  const [filter, setFilter] = useState("");
  const [items, setItems] = useState(demoItems);
  const [selected, setSelected] = useState<string[]>(demoItems.slice(0, 2).map((item) => item.id));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const query = filter.trim().toLowerCase();
  const rows = query ? items.filter((item) => item.name.toLowerCase().includes(query)) : items;
  const shown = rows.filter((item) => selected.includes(item.id)).length;
  const allState = shown === 0 ? false : shown === rows.length ? true : "indeterminate";
  const count = `${selected.length} item${selected.length === 1 ? "" : "s"}`;

  function toggle(id: string) {
    setSelected((ids) => (ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]));
  }

  // Select-all works on the rows in view, and leaves a selection the filter hides alone.
  function toggleAll(checked: boolean) {
    const ids = rows.map((item) => item.id);
    setSelected((current) =>
      checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)),
    );
  }

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Furniture"
        title="Page blocks"
        description="The furniture around a list: a filter bar, a selection toolbar and a confirm step, so a new list page starts from the same shape."
        actions={
          <Button icon={Plus} onClick={() => notify.created("Item")}>
            New item
          </Button>
        }
      />

      <div className="grid gap-3">
        <ListFilterBar value={filter} onChange={setFilter} placeholder="Filter items…" />
        <SelectionToolbar count={selected.length} onClear={() => setSelected([])}>
          <Button
            icon={Download}
            size="sm"
            variant="secondary"
            className="h-7 px-2 text-xs"
            disabled={selected.length === 0}
            onClick={() => notify.success(`${selected.length} exported`)}
          >
            Export
          </Button>
          <Button
            icon={Trash2}
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-danger-fg"
            disabled={selected.length === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Delete
          </Button>
        </SelectionToolbar>

        <div className="overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select all"
                    checked={allState}
                    disabled={rows.length === 0}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Stored</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${item.name}`}
                      checked={selected.includes(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <StatusBadge state={item.state} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBytes(item.bytes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 ? (
            <div className="grid place-items-center gap-2 px-4 py-12 text-center">
              {items.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">No items left.</p>
                  <Button size="sm" variant="secondary" onClick={() => setItems(demoItems)}>
                    Bring them back
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Nothing matches “{filter}”.</p>
                  <Button size="sm" variant="secondary" onClick={() => setFilter("")}>
                    Clear the filter
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${count}?`}
        description="They and their history are removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setItems((current) => current.filter((item) => !selected.includes(item.id)));
          notify.deleted(count);
          setSelected([]);
          setConfirmOpen(false);
        }}
      >
        <p className="rounded-lg bg-inset px-3 py-2 text-xs text-muted-foreground shadow-[var(--shadow-border)]">
          A dialog can carry extra content between the description and the buttons.
        </p>
      </ConfirmDialog>
    </PageShell>
  );
}
