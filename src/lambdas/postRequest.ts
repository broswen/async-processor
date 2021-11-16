"use strict";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import KSUID from "ksuid";
import { ProcessingRequest } from "../models/models";
import { createError } from "../util/util";

const sqsClient: SQSClient = new SQSClient({})
const ddbClient: DynamoDBClient = new DynamoDBClient({})

module.exports.handler = async (event: APIGatewayProxyEventV2) => {
  if (event.body === undefined) {
    return createError("body is undefined", 400)
  }

  // TODO do some json validation for the processing request

  const request: ProcessingRequest = JSON.parse(event.body) as ProcessingRequest
  const id = (await KSUID.random()).string
  request.id = id

  // submit to sqs
  const sendMessageInput: SendMessageCommandInput = {
    QueueUrl: process.env.REQUESTQUEUE,
    MessageBody: JSON.stringify(request)
  }

  try {
    let result = await sqsClient.send(new SendMessageCommand(sendMessageInput))
  } catch (err: unknown) {
    console.error(err)
    return createError("Internal Server Error", 500)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        id,
      }
    )
  };
};
