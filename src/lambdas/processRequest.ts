"use strict";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";
import { SQSEvent, SQSRecord } from "aws-lambda";
import ProcessingItemService from "../services/ProcessingItemService";

const sqsClient: SQSClient = new SQSClient({})
const ddbClient: DynamoDBClient = new DynamoDBClient({})
const itemService: ProcessingItemService = new ProcessingItemService(ddbClient)

module.exports.handler = async (event: SQSEvent) => {
  // track failed requests
  const failedRecords: SQSRecord[] = []

  for (const record of event.Records) {

    const requestId = record.body
    const item = await itemService.GetItem(requestId)

    if (item === undefined) {
      console.error(`item not found for ${requestId}`)
      continue
    }

    // update dynamodb status to processing
    item.status = "processing"
    await itemService.UpdateItem(item)

    console.log(`processing request ${item.id}: '${item.name}' of type '${item.type}' for amount ${item.amount}`)
    // this is where the real business logic would take place
    // this can be a step function workflow to allow for longer and more complex processing flows
    console.log(`finished processing ${item.id}`)

    // fail negative amounts as an example of failures
    if (item.amount < 0) {
      console.error(`request ${item.id} has negative amount`)
      failedRecords.push(record)
      // update dynamodb status to failed
      item.status = "error"
      item.result = "amount is negative"
      await itemService.UpdateItem(item)
      continue
    }

    // update dynamodb status to complete
    item.status = "completed"
    item.result = "some business result"
    await itemService.UpdateItem(item)
  }

  if (failedRecords.length === event.Records.length) {
    throw new Error('all items failed, failing batch')
  }
  // return failed requests to dead letter queue
  if (failedRecords) {
    for (const record of failedRecords) {
      const sendMessageInput: SendMessageCommandInput = {
        QueueUrl: process.env.REQUESTDLQ,
        MessageBody: JSON.stringify(record.body)
      }
      await sqsClient.send(new SendMessageCommand(sendMessageInput))
    }
  }
  return
};