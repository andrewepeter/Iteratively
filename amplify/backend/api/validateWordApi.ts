import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';

export class ValidateWordApiStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Define the Lambda function
        const validateWordFunction = new lambda.Function(this, 'ValidateWordFunction', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('amplify/backend/function/validateWord/src'), // Ensure this path is correct
        });

        // Define the API Gateway REST API
        const api = new apigateway.RestApi(this, 'ValidateWordApi', {
            restApiName: 'Validate Word Service',
            description: 'This service validates if a word is real.',
        });

        // Integrate the Lambda function with the API Gateway
        const getWordIntegration = new apigateway.LambdaIntegration(validateWordFunction, {
            requestTemplates: { 'application/json': '{"statusCode": 200}' }
        });

        // Define the /validateWord resource and GET method
        const validateWord = api.root.addResource('validateWord');
        validateWord.addMethod('GET', getWordIntegration);
    }
}

export const api = new ValidateWordApiStack(new cdk.App(), 'ValidateWordApiStack');