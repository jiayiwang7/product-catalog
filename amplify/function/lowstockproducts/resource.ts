import { defineFunction, secret } from "@aws-amplify/backend";

const branchName = process.env.AWS_BRANCH ?? "sandbox";

export const lowstockproducts = defineFunction({
    entry: "./index.js",
    name: `lowstockproducts-${branchName}`,
    timeoutSeconds: 25,
    memoryMB: 128,
    environment: { LOW_STOCK_THRESHOLD: "5", PRODUCT_CATALOG_SECRET: secret("PRODUCT_CATALOG_SECRET"), ENV: `${branchName}`, REGION: "us-west-2" },
    runtime: 22
});
