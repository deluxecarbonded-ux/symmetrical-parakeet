export function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isValidUsername(value) {
  const username = normalizeUsername(value);
  return (
    username.length >= 3 &&
    username.length <= 24 &&
    !/[\s\u0000-\u001f\u007f]/u.test(username)
  );
}

export function publicUsername(profile) {
  const candidate =
    profile?.username ||
    (profile?.displayName && profile.displayName !== "Player"
      ? profile.displayName
      : "") ||
    (profile?.display_name && profile.display_name !== "Player"
      ? profile.display_name
      : "");
  return normalizeUsername(candidate);
}

export function profileFromAuthUser(user) {
  const username = normalizeUsername(
    user?.user_metadata?.username || user?.user_metadata?.user_name || "",
  );
  return {
    id: user?.id,
    username: username || null,
    displayName: username || "Player",
    createdAt: new Date().toISOString(),
  };
}
