import { defineFunction } from "@aws-amplify/backend";

const branchName = process.env.AWS_BRANCH ?? "sandbox";

export const S3Trigger17a24ec7 = defineFunction({
    entry: "./index.js",
    name: `S3Trigger17a24ec7-${branchName}`,
    timeoutSeconds: 25,
    memoryMB: 128,
    environment: { ENV: `${branchName}`, REGION: "us-west-2" },
    runtime: 22
});
