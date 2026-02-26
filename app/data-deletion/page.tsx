export default function DataDeletion() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || "support@example.com";

  return (
    <main style={{ padding: "40px", maxWidth: 800, margin: "0 auto" }}>
      <h1>Data Deletion Instructions</h1>

      <p>
        If you wish to delete your account and associated data, please send an
        email to:
      </p>

      <p><strong>{supportEmail}</strong></p>

      <p>
        Include your Facebook email and we will process your request within 7 days.
      </p>
    </main>
  );
}
