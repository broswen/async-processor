"use strict";

import { DynamoDBClient, UpdateItemCommand, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { ProcessingRequest } from "../models/models";

const sqsClient: SQSClient = new SQSClient({})
const ddbClient: DynamoDBClient = new DynamoDBClient({})

module.exports.handler = async (event: SQSEvent) => {
  // track failed requests
  const failedRecords: SQSRecord[] = []

  for (let record of event.Records) {

    // parse request into the event type
    let request = JSON.parse(record.body) as ProcessingRequest

    // update dynamodb status to processing
    await setStatus(request.id, "processing")

    // do some processing on the request
    // this is where the real business logic would take place
    // this can be a step function workflow to allow for longer and more complex processing flows
    console.log(`processing request ${request.id}: '${request.name}' of type '${request.type}' for amount ${request.amount}`)

    // fail negative amounts as an example of failures
    if (request.amount < 0) {
      console.error(`request ${request.id} has negative amount`)
      failedRecords.push(record)
      // update dynamodb status to failed
      await setStatus(request.id, "error")
      continue
    }

    // update dynamodb status to complete
    await setStatus(request.id, "complete")

  }

  // return failed requests to dead letter queue
  if (failedRecords) {
    for (let record of failedRecords) {
      await failMessage(record.body)
    }
  }

  return
};

async function setStatus(id: string, status: string) {
  const updateItemInput: UpdateItemCommandInput = {
    TableName: process.env.REQUESTTABLE,
    Key: {
      PK: {
        S: id
      },
    },
    UpdateExpression: "SET #s = :s",
    ExpressionAttributeNames: {
      "#s": "status"
    },
    ExpressionAttributeValues: {
      ":s": {
        S: status
      }
    }
  }

  await ddbClient.send(new UpdateItemCommand(updateItemInput))
}

async function failMessage(message: string) {
  const sendMessageInput: SendMessageCommandInput = {
    QueueUrl: process.env.REQUESTDLQ,
    MessageBody: JSON.stringify(message)
  }
  await sqsClient.send(new SendMessageCommand(sendMessageInput))
}