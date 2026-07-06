import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-charlie-50 via-white to-charlie-100 px-4">
      <div className="w-full max-w-md rounded-3xl border bg-white p-10 shadow-elegant">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-charlie text-3xl shadow-elegant">
            🤖
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Charlie
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El agente comercial de IA de{" "}
            <span className="font-semibold text-charlie-700">Tita Media</span>.
            Cuido el pipeline, te aviso de leads fríos y hago seguimiento por ti.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" variant="gradient" size="lg" className="w-full">
            Entrar con Google
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acceso restringido a cuentas{" "}
          <span className="font-medium">@titamedia.com</span>
        </p>
      </div>
    </main>
  );
}
