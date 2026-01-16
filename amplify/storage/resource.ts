import { defineStorage } from "@aws-amplify/backend";
import { S3Trigger17a24ec7 } from "./S3Trigger17a24ec7/resource";

const branchName = process.env.AWS_BRANCH ?? "sandbox";

export const storage = defineStorage({ name: `productcataloga841deb0dbf546e7baef4c7f9404ebea58056-${branchName}`, access: allow => ({
        "public/*": [allow.authenticated.to(["write", "read", "delete"])],
        "protected/{entity_id}/*": [allow.authenticated.to(["write", "read", "delete"])],
        "private/{entity_id}/*": [allow.authenticated.to(["write", "read", "delete"])]
    }), triggers: {
        onUpload: S3Trigger17a24ec7,
        onDelete: S3Trigger17a24ec7
    } });
