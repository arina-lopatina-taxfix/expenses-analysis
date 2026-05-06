import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import { getProviderData as getPostHogProviderData } from "@flags-sdk/posthog";
import * as flags from "../../../flags";

export const GET = createFlagsDiscoveryEndpoint(async () => {
  const [flagsData, providerData] = await Promise.all([
    Promise.resolve(getProviderData(flags)),
    getPostHogProviderData({
      personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
      projectId: process.env.POSTHOG_PROJECT_ID,
    }),
  ]);

  return {
    definitions: {
      ...flagsData.definitions,
      ...providerData.definitions,
    },
    hints: [...flagsData.hints, ...providerData.hints],
  };
});
