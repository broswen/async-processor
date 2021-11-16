"use strict";

import { DynamoDBClient, GetItemCommandInput, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createError } from "../util/util";

const ddbClient: DynamoDBClient = new DynamoDBClient({})

module.exports.handler = async (event: APIGatewayProxyEventV2) => {
  if (event.pathParameters === undefined || event.pathParameters['id'] === undefined) {
    return createError("id parameter is undefined", 400)
  }

  const id = event.pathParameters['id']

  const getItemInput: GetItemCommandInput = {
    TableName: process.env.REQUESTTABLE,
    Key: {
      PK: {
        S: id
      }
    }
  }

  let item: Object
  try {
    const getItemResult = await ddbClient.send(new GetItemCommand(getItemInput))
    if (getItemResult.Item === undefined) {
      return createError("request doesn't exist for id", 400)
    }
    item = getItemResult.Item

  } catch (err) {
    console.error(err)
    return createError("Internal Server Error", 500)
  }


  return {
    statusCode: 200,
    body: JSON.stringify(item)
  };
};
