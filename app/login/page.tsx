import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Error de configuración del servidor. Contacta al administrador.",
  AccessDenied: "Acceso denegado. Solo cuentas @titamedia.com pueden entrar.",
  Verification: "El enlace de verificación expiró o ya fue usado.",
  Default: "Ocurrió un error al iniciar sesión. Intenta de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null;

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
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
            {error && (
              <span className="ml-1 font-mono text-xs text-red-500">
                [{error}]
              </span>
            )}
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" size="lg" className="w-full gradient-charlie text-white hover:opacity-90">
            Entrar con Google (@titamedia.com)
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
