// Details of the site's operator for the Privacy Policy and Terms of Use. Fill these in before launch:
// an empty value is shown on the pages as a highlighted "to be filled in" placeholder, never invented.
export const legal = {
  /**
   * Version of the two documents, stored with each new account's consent (User.termsVersion).
   * Change it (e.g. to the new date) whenever the texts change in substance.
   */
  version: "2026-10-27",
  /** Date the current texts take effect, shown at the top of both pages (YYYY-MM-DD) */
  effectiveDate: "2026-10-27",
  operator: {
    /** Full legal name: a company (e.g. «... MMC») or an individual entrepreneur */
    name: "",
    /** Tax identification number (VÖEN) */
    taxId: "",
    /** Registered address */
    address: "",
    /** Email for privacy and data requests */
    email: "",
    /** Phone for privacy and data requests (optional) */
    phone: "",
  },
  /** Where the site and its database are hosted (provider and country) */
  hosting: "",
  /** How many days a request about personal data is answered within */
  responseDays: "",
  /** How long database backups keep data, including deleted accounts (e.g. «30 gün») */
  backupRetention: "",
} as const;
