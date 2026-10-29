"use client";

import { useId, useState, type FormEvent } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { ActionDialog } from "@/components/action-dialog";
import {
  FIELD_CLASS,
  FILE_CLASS,
  Field,
  FormError,
} from "@/components/dormitory/admin-ui";
import { Input } from "@/components/ui/input";
import {
  STAFF_POSITIONS,
  WEEKDAYS,
  type DormStaff,
  type OfficeHour,
  type StaffPosition,
} from "@/lib/dormitory/data";
import { newId } from "@/lib/dormitory/utils";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const NEW_HOUR: OfficeHour = { day: "Mon", start: "09:00", end: "17:00" };

/** Add (`person` null) or edit one staff member. */
export function StaffDialog({
  person,
  onSave,
  onClose,
}: {
  person: DormStaff | null;
  onSave: (next: DormStaff, photoFile: File | null) => void;
  onClose: () => void;
}) {
  const formId = `${useId()}-staff`;
  const [name, setName] = useState(person?.name ?? "");
  const [nickname, setNickname] = useState(person?.nickname ?? "");
  const [position, setPosition] = useState<StaffPosition>(
    person?.position ?? "dormitory_staff",
  );
  const [hours, setHours] = useState<OfficeHour[]>(
    person?.officeHours ?? [NEW_HOUR],
  );
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [lineId, setLineId] = useState(person?.lineId ?? "");
  const [photo, setPhoto] = useState<string | null>(person?.photo ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateHour(index: number, patch: Partial<OfficeHour>) {
    setHours((current) =>
      current.map((hour, i) => (i === index ? { ...hour, ...patch } : hour)),
    );
  }

  function handlePhoto(file: File | null) {
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]).has(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("The profile photo must be under 5 MiB.");
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhoto(URL.createObjectURL(file));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const badHour = hours.find((hour) => hour.end <= hour.start);
    if (badHour) {
      setError(`${badHour.day}: the end time must be after the start time.`);
      return;
    }
    onSave({
      id: person?.id ?? newId(),
      name: name.trim(),
      nickname: nickname.trim(),
      position,
      officeHours: hours,
      phone: phone.trim(),
      lineId: lineId.trim(),
      photo,
    }, photoFile);
  }

  return (
    <ActionDialog
      open
      onOpenChange={() => {}}
      title={person ? "Edit staff" : "Add staff"}
      actionLabel="Save"
      actionType="submit"
      actionForm={formId}
      isActionDisabled={!name.trim()}
      onCancel={onClose}
    >
      <form id={formId} onSubmit={handleSubmit} className="min-w-0 space-y-4">
        <FormError message={error} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor={`${formId}-name`}>
            <Input
              id={`${formId}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
            />
          </Field>
          <Field label="Nickname" htmlFor={`${formId}-nickname`}>
            <Input
              id={`${formId}-nickname`}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={40}
            />
          </Field>
        </div>
        <Field label="Position" htmlFor={`${formId}-position`}>
          <select
            id={`${formId}-position`}
            value={position}
            onChange={(event) => setPosition(event.target.value as StaffPosition)}
            className={FIELD_CLASS}
          >
            {(Object.keys(STAFF_POSITIONS) as StaffPosition[]).map((key) => (
              <option key={key} value={key}>
                {STAFF_POSITIONS[key]}
              </option>
            ))}
          </select>
        </Field>

        <fieldset className="min-w-0 space-y-2">
          <legend className="mb-1 text-xs font-medium text-black-2">
            Office hour
          </legend>
          {hours.map((hour, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-black-5 bg-black-6/40 p-3"
            >
              <select
                aria-label="Day"
                value={hour.day}
                onChange={(event) =>
                  updateHour(index, { day: event.target.value as OfficeHour["day"] })
                }
                className={FIELD_CLASS}
              >
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setHours((current) => current.filter((_, i) => i !== index))
                }
                className="inline-flex items-center justify-end gap-1 text-xs font-medium text-black-3 hover:text-negative-primary"
              >
                <Trash2Icon className="size-4" />
                Remove
              </button>
              <label className="flex min-w-0 flex-col gap-1 text-[11px] text-black-3">
                From
                <input
                  type="time"
                  value={hour.start}
                  onChange={(event) => updateHour(index, { start: event.target.value })}
                  required
                  className={FIELD_CLASS}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-[11px] text-black-3">
                To
                <input
                  type="time"
                  value={hour.end}
                  onChange={(event) => updateHour(index, { end: event.target.value })}
                  required
                  className={FIELD_CLASS}
                />
              </label>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setHours((current) => [...current, NEW_HOUR])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-secondary"
          >
            <PlusIcon className="size-3.5" />
            Add day
          </button>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone number" htmlFor={`${formId}-phone`}>
            <Input
              id={`${formId}-phone`}
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>
          <Field label="LINE ID" htmlFor={`${formId}-line`}>
            <Input
              id={`${formId}-line`}
              value={lineId}
              onChange={(event) => setLineId(event.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Profile image"
          htmlFor={`${formId}-photo`}
          hint={photo ? "Choose another image to replace the current one." : undefined}
        >
          <input
            id={`${formId}-photo`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => handlePhoto(event.target.files?.[0] ?? null)}
            className={FILE_CLASS}
          />
        </Field>
      </form>
    </ActionDialog>
  );
}
