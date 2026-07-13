import bcrypt from "bcryptjs";

export interface TeamUser {
  email: string;
  name: string;
  hash: string;
}

function loadTeamUsers(): TeamUser[] {
  const vars = [
    process.env.USER_TANIA,
    process.env.USER_AURA,
    process.env.USER_JULIANA,
  ].filter(Boolean) as string[];

  return vars.map((v) => {
    const [email, hash] = v.split(":");
    const name = email.split("@")[0];
    return { email, name, hash };
  });
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<TeamUser | null> {
  const users = loadTeamUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.hash);
  return valid ? user : null;
}
