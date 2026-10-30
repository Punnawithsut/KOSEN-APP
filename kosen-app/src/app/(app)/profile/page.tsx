import { createClient } from "@/lib/supabase/server";
import { fetchUserProfile } from "../../api/profile/profile.service";
import ProfileView from "./profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let initialProfile = undefined;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const userProfile = await fetchUserProfile(user.id);
      if (userProfile) {
        initialProfile = { data: userProfile };
      }
    }
  } catch (error) {
    console.error("[SSR Prefetch] Failed to prefetch profile:", error);
  }

  return (
    <div className="bg-bg-primary">
      <ProfileView initialProfile={initialProfile} />
    </div>
  );
}