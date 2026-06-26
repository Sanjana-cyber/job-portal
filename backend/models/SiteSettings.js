const mongoose = require("mongoose");

/**
 * SiteSettings — singleton document storing global portal configuration.
 * Always accessed via SiteSettings.getSettings() which auto-creates on first use.
 */
const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "global" },

    /**
     * When true, recruiters must have companyVerificationStatus === "approved"
     * before they can create or update job posts.
     * When false, all recruiters can post freely.
     */
    verificationRequired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * Returns the single settings document, creating it with defaults if absent.
 */
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById("global");
  if (!settings) {
    settings = await this.create({ _id: "global", verificationRequired: false });
  }
  return settings;
};

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
