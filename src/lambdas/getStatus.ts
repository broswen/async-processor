"use strict";

import { DynamoDBClient, GetItemCommand, GetItemCommandInput } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ProcessingItem } from "../models/models";
import ProcessingItemService from "../services/ProcessingItemService";
import { createError } from "../util/util";

const ddbClient: DynamoDBClient = new DynamoDBClient({})
const itemService: ProcessingItemService = new ProcessingItemService(ddbClient)

module.exports.handler = async (event: APIGatewayProxyEventV2) => {
  if (event.pathParameters === undefined || event.pathParameters['id'] === undefined) {
    return createError("id parameter is undefined", 400)
  }

  const requestId = event.pathParameters['id']
  let item: ProcessingItem | undefined
  try {
    item = await itemService.GetItem(requestId)
  } catch (err) {
    console.error(err)
    return createError("Internal Server Error", 500)
  }

  if (item === undefined) {
    return createError("Item Not Found", 404)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(item)
  };
};
