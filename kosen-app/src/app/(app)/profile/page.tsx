"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useMyProfile,
  useUpdateMyProfile,
  type MyProfile,
} from "@/hooks/use-profile";

const DEPARTMENTS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Electrical and Electronics Engineering",
];
const YEARS = [1, 2, 3, 4, 5];
const DORM_BUILDINGS = [7, 8];

type ProfileForm = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  dormBuilding: string;
  dormRoom: string;
  avatarUrl: string;
};

const EMPTY_FORM: ProfileForm = {
  studentId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "",
  year: "",
  dormBuilding: "",
  dormRoom: "",
  avatarUrl: "",
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const snapshotRef = useRef<ProfileForm>(EMPTY_FORM);
  const { data: profile, error: profileError, isLoading } = useMyProfile();
  const { trigger: updateMyProfile, isMutating: isSaving } =
    useUpdateMyProfile();
  const displayedForm = !isEditing && profile ? toProfileForm(profile) : form;

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEditing() {
    const currentForm = profile ? toProfileForm(profile) : form;
    setForm(currentForm);
    snapshotRef.current = currentForm;
    setIsEditing(true);
  }

  function cancelEditing() {
    setForm(snapshotRef.current);
    setIsEditing(false);
  }

  function handleAvatarPick() {
    if (isEditing) fileInputRef.current?.click();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    // TODO: connect to api — upload file (e.g. to Supabase Storage), then
    // update(avatarUrl, <returned public URL>) once the upload resolves.
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    try {
      const response = await updateMyProfile({
        studentId: form.studentId,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        department: form.department,
        ...(form.year ? { year: Number(form.year) } : {}),
        dormBuilding: form.dormBuilding,
        dormRoom: form.dormRoom,
      });
      const updatedForm = toProfileForm(response.data);
      setForm(updatedForm);
      snapshotRef.current = updatedForm;
      setIsEditing(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save your profile.",
      );
    }
  }

  function handleNotificationToggle(next: boolean) {
    setNotificationsEnabled(next);
    // TODO: connect to api — persist immediately, independent of edit mode
    // and independent of the profile Save button.
    // fetch("/api/profile/notifications", {
    //   method: "PATCH",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ notificationsEnabled: next }),
    // });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FBF3E7]">
      {/* decorative circles — anchored to corners, quiet relative to the form */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-16 size-64 rounded-full"
        style={{ background: "linear-gradient(135deg, #F2A66B, #C65D2E)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-20 size-72 rounded-full"
        style={{ background: "linear-gradient(135deg, #AED2EC, #3E6FA0)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-32 size-40 rounded-full"
        style={{ background: "#6B9BC9", opacity: 0.6 }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center px-6 py-16">
        <h1
          className="text-3xl text-[#2B2420]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Your Profile
        </h1>
        <p className="mt-1 text-sm text-[#6B5F54]">
          Keep your details up to date so we can reach you.
        </p>

        <form
          onSubmit={handleSave}
          className="relative mt-10 w-full rounded-2xl bg-white/90 p-8 pt-20 shadow-[0_8px_30px_rgba(43,36,32,0.08)] backdrop-blur-sm"
        >
          {/* avatar, bigger, overlapping the card's top edge */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={handleAvatarPick}
              className="relative block size-32 overflow-hidden rounded-full border-4 border-white shadow-md"
              aria-label={isEditing ? "Change profile photo" : "Profile photo"}
            >
              {avatarPreview || displayedForm.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview ?? displayedForm.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div
                  className="flex size-full items-center justify-center text-3xl font-medium text-white"
                  style={{
                    background: "linear-gradient(135deg, #F2A66B, #C65D2E)",
                  }}
                >
                  {displayedForm.firstName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            {/* small pencil badge — opens edit mode */}
            {!isEditing && (
              <button
                type="button"
                onClick={startEditing}
                aria-label="Edit profile"
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#C65D2E] text-white shadow-sm transition-colors hover:bg-[#B14F24]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4"
                >
                  <path
                    d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {profileError ? (
            <p role="alert" className="py-10 text-center text-sm text-red-700">
              Unable to load your profile: {profileError.message}
            </p>
          ) : isLoading ? (
            <p className="py-10 text-center text-sm text-[#6B5F54]">
              Loading your profile…
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Student ID" className="sm:col-span-2">
                <ViewOrInput
                  editing={isEditing}
                  value={displayedForm.studentId}
                  onChange={(v) => update("studentId", v)}
                  placeholder="65010123"
                />
              </Field>

              <Field label="First name">
                <ViewOrInput
                  editing={isEditing}
                  value={displayedForm.firstName}
                  onChange={(v) => update("firstName", v)}
                  placeholder="First name"
                />
              </Field>

              <Field label="Last name">
                <ViewOrInput
                  editing={isEditing}
                  value={displayedForm.lastName}
                  onChange={(v) => update("lastName", v)}
                  placeholder="Last name"
                />
              </Field>

              <Field label="Phone" className="sm:col-span-2">
                <ViewOrInput
                  editing={isEditing}
                  value={displayedForm.phone}
                  onChange={(v) => update("phone", v)}
                  placeholder="08x-xxx-xxxx"
                />
              </Field>

              <Field label="Email" className="sm:col-span-2">
                <ViewOrInput
                  editing={isEditing}
                  type="email"
                  value={displayedForm.email}
                  onChange={(v) => update("email", v)}
                  placeholder="you@kmitl.ac.th"
                />
              </Field>

              <Field label="Department">
                {isEditing ? (
                  <Select
                    value={displayedForm.department}
                    onChange={(e) => update("department", e.target.value)}
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <ViewValue                   value={displayedForm.department} />
                )}
              </Field>

              <Field label="Year">
                {isEditing ? (
                  <Select
                    value={displayedForm.year}
                    onChange={(e) => update("year", e.target.value)}
                  >
                    <option value="" disabled>
                      Select year
                    </option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <ViewValue value={displayedForm.year && `Year ${displayedForm.year}`} />
                )}
              </Field>

              <Field label="Dorm building">
                {isEditing ? (
                  <Select
                    value={displayedForm.dormBuilding}
                    onChange={(e) => update("dormBuilding", e.target.value)}
                  >
                    <option value="" disabled>
                      Select building
                    </option>
                    {DORM_BUILDINGS.map((b) => (
                      <option key={b} value={b}>
                        Building {b}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <ViewValue
                    value={displayedForm.dormBuilding && `Building ${displayedForm.dormBuilding}`}
                  />
                )}
              </Field>

              <Field label="Dorm room">
                <ViewOrInput
                  editing={isEditing}
                  value={displayedForm.dormRoom}
                  onChange={(v) => update("dormRoom", v)}
                  placeholder="e.g. 304"
                />
              </Field>
            </div>
          )}

          {isEditing && (
            <div className="mt-8 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-[#C65D2E] text-white hover:bg-[#B14F24]"
              >
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )}

          {saveError && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {saveError}
            </p>
          )}

          {/* always available, independent of edit mode */}
          <div className="mt-6 flex items-center justify-between rounded-xl border border-[#EFE4D4] bg-[#FBF3E7]/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#2B2420]">
                Notifications
              </p>
              <p className="text-xs text-[#6B5F54]">
                Announcements and reminders
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

function toProfileForm(profile: MyProfile): ProfileForm {
  return {
    studentId: profile.studentId ?? "",
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email,
    phone: profile.phone ?? "",
    department: profile.department ?? "",
    year: profile.year?.toString() ?? "",
    dormBuilding: profile.dormBuilding ?? "",
    dormRoom: profile.dormRoom ?? "",
    avatarUrl: profile.avatarUrl ?? "",
  };
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-[#2B2420]">{label}</span>
      {children}
    </label>
  );
}

/** Plain-text display used in view mode for a value with no dropdown. */
function ViewValue({ value }: { value?: string | false }) {
  return (
    <p className="px-2.5 py-1 text-base text-[#2B2420] md:text-sm">
      {value || "—"}
    </p>
  );
}

/** Swaps between a read-only text display and a real Input depending on edit mode. */
function ViewOrInput({
  editing,
  value,
  onChange,
  ...rest
}: {
  editing: boolean;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  if (!editing) return <ViewValue value={value} />;
  return (
    <Input value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
  );
}
