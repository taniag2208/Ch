import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Sidebar } from "@/components/chat/Sidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "Usuario";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const email = user.email ?? "";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar name={name} email={email} avatarUrl={avatarUrl} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
