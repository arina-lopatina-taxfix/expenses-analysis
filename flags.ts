import { flag } from "flags/next";
import { postHogAdapter } from "@flags-sdk/posthog";

export const profilePageFlag = flag<boolean>({
  key: "profile-page",
  defaultValue: true,
  adapter: postHogAdapter.isFeatureEnabled(),
});

export const uploadPageFlag = flag<boolean>({
  key: "upload-page",
  defaultValue: true,
  adapter: postHogAdapter.isFeatureEnabled(),
});

export const analyzingPageFlag = flag<boolean>({
  key: "analyzing-page",
  defaultValue: true,
  adapter: postHogAdapter.isFeatureEnabled(),
});

export const signupPageFlag = flag<boolean>({
  key: "signup-page",
  defaultValue: true,
  adapter: postHogAdapter.isFeatureEnabled(),
});

export const resultsPageFlag = flag<boolean>({
  key: "results-page",
  defaultValue: true,
  adapter: postHogAdapter.isFeatureEnabled(),
});
