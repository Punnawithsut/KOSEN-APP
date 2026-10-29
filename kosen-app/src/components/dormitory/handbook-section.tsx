"use client";

import { useState } from "react";
import { ArrowUpRightIcon, DownloadIcon, EyeIcon, FileXIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/components/dormitory/admin-ui";
import { DeleteConfirmDialog } from "@/components/dormitory/delete-confirm-dialog";
import {
  HandbookDialog,
  RuleDialog,
} from "@/components/dormitory/handbook-dialogs";
import { useToast } from "@/hooks/use-toast";
import type { DormHandbook, DormRule } from "@/lib/dormitory/data";

const ACTION_BASE =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-all active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-secondary";

export function HandbookSection({
  handbook,
  rules,
  showHandbook,
  isAdmin = false,
  onHandbookUpload,
  onHandbookDelete,
  onRuleSave,
  onRuleDelete,
}: {
  handbook: DormHandbook;
  rules: DormRule[];
  showHandbook: boolean;
  isAdmin?: boolean;
  onHandbookUpload?: (formData: FormData) => Promise<unknown>;
  onHandbookDelete?: () => Promise<void>;
  onRuleSave?: (rule: DormRule) => void;
  onRuleDelete?: (id: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [activeRule, setActiveRule] = useState<string | null>(null);
  const [editingHandbook, setEditingHandbook] = useState(false);
  const [confirmHandbookDelete, setConfirmHandbookDelete] = useState(false);
  // undefined = closed, null = adding, rule = editing.
  const [editingRule, setEditingRule] = useState<DormRule | null | undefined>(
    undefined,
  );
  const [deletingRule, setDeletingRule] = useState<DormRule | null>(null);

  function handleDownload() {
    if (!handbook.pdfUrl) {
      toast({
        title: "No file available yet",
        description: "The handbook has not been uploaded. Please check back later.",
        variant: "error",
      });
      return;
    }
    window.location.assign(`${handbook.pdfUrl}?download=1`);
  }

  function openRule(id: string | null) {
    setActiveRule(id);
    setRulesOpen(true);
  }

  const visibleRules = activeRule
    ? rules.filter((rule) => rule.id === activeRule)
    : rules;

  return (
    <section aria-labelledby="handbook-heading" className="flex flex-col gap-3">
      <div>
        <h2
          id="handbook-heading"
          className="font-display text-3xl text-black-1 md:text-4xl"
        >
          Handbooks &amp; Rules
        </h2>
        <p className="text-sm text-black-3">
          Tap a document to view or download the dormitory handbook and rules
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {showHandbook ? (
          <div className="relative flex gap-4 rounded-2xl border-2 border-orange-subtle-1 bg-orange-subtle-2 p-4">
            {isAdmin ? (
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <EditButton label="Update handbook" onClick={() => setEditingHandbook(true)} />
                {handbook.pdfUrl ? <DeleteButton label="Delete handbook file" onClick={() => setConfirmHandbookDelete(true)} /> : null}
              </div>
            ) : null}
            {/* Book cover */}
            <div
              aria-hidden
              className="relative w-28 shrink-0 self-stretch rounded-lg bg-orange-primary shadow-md sm:w-36"
            >
              <span className="absolute inset-y-0 right-4 w-2.5 bg-white/90" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl leading-tight text-black-2 sm:text-3xl">
                  {handbook.title}
                </h3>
                <p className="mt-2 text-xs text-black-2">
                  {handbook.edition} · {handbook.pages} pages
                  <br />
                  Updated {handbook.updatedAt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className={`${ACTION_BASE} bg-white text-black-1 hover:bg-white/80`}
                >
                  <EyeIcon className="size-4" />
                  Read
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className={`${ACTION_BASE} bg-orange-primary text-white hover:brightness-95`}
                >
                  <DownloadIcon className="size-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {rules.length > 0 || isAdmin ? (
          <div className="flex flex-col gap-4 rounded-2xl border-2 border-orange-subtle-1 bg-orange-subtle-2 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-4 sm:w-40 sm:shrink-0 sm:flex-col sm:items-start">
              <h3 className="font-display text-3xl text-black-2">Rules</h3>
              <button
                type="button"
                onClick={() => openRule(null)}
                className={`${ACTION_BASE} bg-white text-black-1 hover:bg-white/80`}
              >
                <EyeIcon className="size-4" />
                Read all
              </button>
            </div>
            <ul className="flex flex-1 flex-col gap-2">
              {rules.map((rule) => (
                <li key={rule.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openRule(rule.id)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg bg-orange-primary px-3 py-2 text-left text-white transition-all hover:brightness-95 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-secondary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {rule.title}
                      </span>
                      <span className="block text-[10px] text-white/80">
                        Updated {rule.updatedAt}
                      </span>
                    </span>
                    <ArrowUpRightIcon className="size-4 shrink-0" />
                  </button>
                  {isAdmin ? (
                    <div className="flex flex-col gap-1">
                      <EditButton label={`Edit ${rule.title}`} onClick={() => setEditingRule(rule)} />
                      <DeleteButton label={`Delete ${rule.title}`} onClick={() => setDeletingRule(rule)} />
                    </div>
                  ) : null}
                </li>
              ))}
              {isAdmin ? (
                <li>
                  <AddButton label="Add rule" onClick={() => setEditingRule(null)} />
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      {/* PDF preview. With no file uploaded it shows an empty state instead. */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="h-[85vh] sm:max-w-3xl grid-rows-[auto_1fr]">
          <DialogHeader>
            <DialogTitle>{handbook.title}</DialogTitle>
            <DialogDescription>
              {handbook.edition} · {handbook.pages} pages
            </DialogDescription>
          </DialogHeader>
          {handbook.pdfUrl ? (
            <iframe
              src={handbook.pdfUrl}
              title={`${handbook.title} preview`}
              className="size-full rounded-lg border"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
              <FileXIcon className="size-10 text-black-4" />
              <p className="font-medium text-black-2">No file available yet</p>
              <p className="max-w-xs text-sm text-black-3">
                The handbook has not been uploaded. Please check back later.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={confirmHandbookDelete}
        title="Delete handbook file?"
        description="This removes the uploaded handbook attachment and its stored metadata."
        itemLabel="Handbook file"
        onCancel={() => setConfirmHandbookDelete(false)}
        onDelete={() => onHandbookDelete?.() ?? Promise.reject(new Error("Handbook deletion is unavailable."))}
      />

      <DeleteConfirmDialog
        open={deletingRule !== null}
        title="Delete rule?"
        description={`“${deletingRule?.title ?? "This rule"}” will be removed from the dormitory rules.`}
        itemLabel="Rule"
        onCancel={() => setDeletingRule(null)}
        onDelete={() => deletingRule && onRuleDelete ? onRuleDelete(deletingRule.id) : Promise.reject(new Error("Rule deletion is unavailable."))}
      />

      {/* Rules text */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeRule ? visibleRules[0]?.title : "Dormitory rules"}
            </DialogTitle>
            <DialogDescription>
              Please read carefully and follow the rules.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {visibleRules.map((rule) => (
              <article key={rule.id}>
                {activeRule ? null : (
                  <h4 className="font-semibold text-black-1">{rule.title}</h4>
                )}
                {rule.body ? (
                  <p className="whitespace-pre-line text-sm text-black-2">
                    {rule.body}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-black-4">
                  Updated {rule.updatedAt}
                </p>
              </article>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {isAdmin && editingHandbook ? (
        <HandbookDialog
          handbook={handbook}
          onClose={() => setEditingHandbook(false)}
          onSave={(next, file) => {
            if (!file) {
              toast({ title: "Choose a handbook PDF", variant: "error" });
              return;
            }
            const body = new FormData();
            body.set("file", file);
            body.set("edition", next.edition);
            body.set("pages", String(next.pages));
            void (onHandbookUpload?.(body) ?? Promise.reject(new Error("Handbook upload is unavailable.")))
              .then(() => {
                setEditingHandbook(false);
                toast({ title: "Handbook updated", variant: "success" });
              })
              .catch((error: unknown) => toast({ title: "Could not update handbook", description: error instanceof Error ? error.message : "Please try again.", variant: "error" }));
          }}
        />
      ) : null}

      {isAdmin && editingRule !== undefined ? (
        <RuleDialog
          key={editingRule?.id ?? "new"}
          rule={editingRule}
          onClose={() => setEditingRule(undefined)}
          onSave={(next) => {
            onRuleSave?.(next);
            setEditingRule(undefined);
            toast({
              title: editingRule ? "Rule updated" : "Rule added",
              variant: "success",
            });
          }}
        />
      ) : null}
    </section>
  );
}
