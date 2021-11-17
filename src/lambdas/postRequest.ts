"use strict";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createError } from "../util/util";
import ProcessingItemService from "../services/ProcessingItemService";
import { ProcessingItemRequest } from "../models/models";

const sqsClient: SQSClient = new SQSClient({})
const ddbClient: DynamoDBClient = new DynamoDBClient({})
const itemService: ProcessingItemService = new ProcessingItemService(ddbClient)

module.exports.handler = async (event: APIGatewayProxyEventV2) => {
  if (event.body === undefined) {
    return createError("body is undefined", 400)
  }

  let body: object
  // parse body into json
  try {
    body = JSON.parse(event.body)
  } catch (err) {
    console.error(err)
    return createError("Bad Request", 400)
  }

  // TODO validate json schema
  const request: ProcessingItemRequest = body as ProcessingItemRequest

  const item = await itemService.CreateRequest(request)

  // submit to sqs
  const sendMessageInput: SendMessageCommandInput = {
    QueueUrl: process.env.REQUESTQUEUE,
    MessageBody: item.id
  }

  try {
    await sqsClient.send(new SendMessageCommand(sendMessageInput))
  } catch (err: unknown) {
    console.error(err)
    return createError("Internal Server Error", 500)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        id: item.id,
      }
    )
  };
};
