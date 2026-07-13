import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthError } from "next-auth";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email o contraseña incorrectos.",
  Configuration: "Error de configuración. Contacta al administrador.",
  Default: "Ocurrió un error al iniciar sesión. Intenta de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { error } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null;

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
          </div>
        )}

        <form
          action={async (formData: FormData) => {
            "use server";
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            try {
              await signIn("credentials", {
                email,
                password,
                redirectTo: "/dashboard",
              });
            } catch (err) {
              if (err instanceof AuthError) {
                redirect(`/login?error=${err.type}`);
              }
              throw err;
            }
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="taniag@titamedia.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-charlie-400 focus:border-charlie-400 focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none ring-charlie-400 focus:border-charlie-400 focus:ring-2"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full gradient-charlie text-white hover:opacity-90"
          >
            Ingresar
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acceso restringido al equipo{" "}
          <span className="font-medium">@titamedia.com</span>
        </p>
      </div>
    </main>
  );
}
