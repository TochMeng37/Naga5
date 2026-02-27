export default function PrivacyPolicy() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim() || "support@example.com";

  return (
    <main style={{ padding: "40px", maxWidth: 800, margin: "0 auto" }}>
      <h1>Privacy Policy</h1>

      <p>Last updated: {new Date().toDateString()}</p>

      <p>
        We respect your privacy. When you log in using social providers, we may collect
        your name, email address, and profile picture.
      </p>

      <p>
        This website is a member access portal for digital community services. It does not provide betting or gambling services.
      </p>

      <p>
        This data is used only for authentication purposes and is not shared
        with third parties.
      </p>

      <p>
        If you would like your data removed, please visit our Data Deletion
        page.
      </p>

      <p>Contact: {supportEmail}</p>
    </main>
  );
}
