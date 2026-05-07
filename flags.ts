import { flag } from "flags/next";

export const profilePageFlag = flag<boolean>({
  key: "profile-page",
  defaultValue: true,
  decide: () => true,
});

export const uploadPageFlag = flag<boolean>({
  key: "upload-page",
  defaultValue: true,
  decide: () => true,
});

export const analyzingPageFlag = flag<boolean>({
  key: "analyzing-page",
  defaultValue: true,
  decide: () => true,
});

export const signupPageFlag = flag<boolean>({
  key: "signup-page",
  defaultValue: true,
  decide: () => true,
});

export const resultsPageFlag = flag<boolean>({
  key: "results-page",
  defaultValue: true,
  decide: () => true,
});
