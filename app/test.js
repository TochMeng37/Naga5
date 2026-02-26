const allowedSources = ["site", "google", "facebook"];

export function parseSignupPayload(body = {}) {
  const name =
    typeof body?.name === "string"
      ? body.name.trim()
      : typeof body?.fullName === "string"
        ? body.fullName.trim()
        : "";

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  const phoneNumber =
    typeof body?.phoneNumber === "string"
      ? body.phoneNumber.replace(/\D/g, "")
      : "";

  const ip = typeof body?.ip === "string" ? body.ip.trim() : "";
  const userAgent =
    typeof body?.userAgent === "string" ? body.userAgent.trim() : "";
  const timezone = typeof body?.timezone === "string" ? body.timezone.trim() : "";

  const rawLocalDateTime =
    typeof body?.localDateTime === "string" ? body.localDateTime : "";
  const parsedDate = rawLocalDateTime ? new Date(rawLocalDateTime) : new Date();
  const localDateTime = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();

  const sourceRaw =
    typeof body?.source === "string" ? body.source.trim().toLowerCase() : "site";
  const source = allowedSources.includes(sourceRaw) ? sourceRaw : "site";

  const enforceUniqueEmail =
    body?.enforceUniqueEmail === true || body?.enforceUniqueEmail === "true";

  return {
    name,
    email,
    phoneNumber,
    ip,
    userAgent,
    timezone,
    localDateTime,
    source,
    enforceUniqueEmail,
  };
}
