import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { S3Trigger17a24ec7 } from "./storage/S3Trigger17a24ec7/resource";
import { lowstockproducts } from "./function/lowstockproducts/resource";
import { defineBackend } from "@aws-amplify/backend";
import { Duration, aws_iam } from "aws-cdk-lib";
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

const backend = defineBackend({
    auth,
    data,
    storage,
    S3Trigger17a24ec7,
    lowstockproducts
});
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.usernameAttributes = ["email"];
cfnUserPool.policies = {
    passwordPolicy: {
        minimumLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSymbols: false,
        temporaryPasswordValidityDays: 7
    }
};
const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
cfnIdentityPool.allowUnauthenticatedIdentities = false;
const userPool = backend.auth.resources.userPool;
userPool.addClient("NativeAppClient", {
    refreshTokenValidity: Duration.days(30),
    disableOAuth: true,
    enableTokenRevocation: true,
    enablePropagateAdditionalUserContextData: false,
    authSessionValidity: Duration.minutes(3),
    generateSecret: false
});
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
s3Bucket.bucketName = 'productcataloga841deb0dbf546e7baef4c7f9404ebea58056-main';
s3Bucket.bucketEncryption = {
    serverSideEncryptionConfiguration: [
        {
            serverSideEncryptionByDefault: {
                sseAlgorithm: "AES256"
            },
            bucketKeyEnabled: false
        }
    ]
};
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
    {
        authenticationType: "API_KEY"
    },
    {
        authenticationType: "AMAZON_COGNITO_USER_POOLS",
        userPoolConfig: {
            awsRegion: backend.auth.resources.userPool.stack.region,
            userPoolId: backend.auth.resources.userPool.userPoolId
        }
    }
];
const branchName = process.env.AWS_BRANCH ?? "sandbox";
backend.S3Trigger17a24ec7.resources.cfnResources.cfnFunction.functionName = `S3Trigger17a24ec7-${branchName}`;
backend.lowstockproducts.resources.cfnResources.cfnFunction.functionName = `lowstockproducts-${branchName}`;

backend.lowstockproducts.addEnvironment('API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT', backend.data.apiKey!)
backend.lowstockproducts.addEnvironment('API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT', backend.data.graphqlUrl)
backend.lowstockproducts.addEnvironment('API_PRODUCTCATALOG_GRAPHQLAPIIDOUTPUT', backend.data.apiId)

backend.lowstockproducts.resources.lambda.addToRolePolicy(new aws_iam.PolicyStatement({
    effect: aws_iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`arn:aws:appsync:${backend.data.stack.region}:${backend.data.stack.account}:apis/${backend.data.apiId}/types/Query/*`]
}))

backend.S3Trigger17a24ec7.addEnvironment('API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT', backend.data.apiKey!)
backend.S3Trigger17a24ec7.addEnvironment('API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT', backend.data.graphqlUrl)
backend.S3Trigger17a24ec7.addEnvironment('API_PRODUCTCATALOG_GRAPHQLAPIIDOUTPUT', backend.data.apiId)

backend.S3Trigger17a24ec7.resources.lambda.addToRolePolicy(new aws_iam.PolicyStatement({
    effect: aws_iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`arn:aws:appsync:${backend.data.stack.region}:${backend.data.stack.account}:apis/${backend.data.apiId}/types/Mutation/*`]
}))

backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(new aws_iam.PolicyStatement({
    effect: aws_iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`arn:aws:appsync:${backend.data.stack.region}:${backend.data.stack.account}:apis/mmmv7rrx6bhnbdicoi3aa6nmcq/*`]
}))

const alertStack = backend.createStack('LowStockAlerts');

const alertTopic = new sns.Topic(alertStack, 'LowStockAlertTopic');
alertTopic.addSubscription(
    new subscriptions.EmailSubscription('jiayi.j.wang+amplify1@gmail.com')
);

// Grant Lambda permission to publish
alertTopic.grantPublish(backend.lowstockproducts.resources.lambda);

// Pass topic ARN to Lambda
backend.lowstockproducts.addEnvironment('ALERT_TOPIC_ARN', alertTopic.topicArn);
