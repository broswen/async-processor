import { DynamoDBClient, GetItemCommand, GetItemCommandInput, ItemCollectionMetrics, PutItemCommand, PutItemCommandInput, UpdateItemCommand, UpdateItemCommandInput } from "@aws-sdk/client-dynamodb"
import KSUID from "ksuid";
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { DynamoDBProcessingItemSchema, ProcessingItem, ProcessingItemRequest } from "../models/models"

export default class ProcessingItemService {
  private ddbClient: DynamoDBClient
  constructor(ddbClient: DynamoDBClient) {
    this.ddbClient = ddbClient
  }

  async GetItem(id: string): Promise<ProcessingItem> {
    const getItemInput: GetItemCommandInput = {
      TableName: process.env.REQUESTTABLE,
      Key: {
        id: {
          S: id
        }
      }
    }

    let item: ProcessingItem
    try {
      const getItemResult = await this.ddbClient.send(new GetItemCommand(getItemInput))
      if (getItemResult.Item === undefined) {
        throw new Error('item not found')
      }
      item = unmarshall(getItemResult.Item) as ProcessingItem

    } catch (err) {
      throw err
    }
    return item
  }

  async UpdateItem(item: ProcessingItem): Promise<ProcessingItem> {
    const updateItemInput: UpdateItemCommandInput = {
      TableName: process.env.REQUESTTABLE,
      Key: {
        id: {
          S: item.id
        },
      },
      UpdateExpression: "SET #s = :s, #r = :r, #a = :a, #n = :n, #t = :t",
      ExpressionAttributeNames: {
        "#s": "status",
        "#r": "result",
        "#a": "amount",
        "#n": "name",
        "#t": "type"
      },
      ExpressionAttributeValues: {
        ":s": {
          S: item.status
        },
        ":r": {
          S: item.result
        },
        ":a": {
          N: String(item.amount)
        },
        ":n": {
          S: item.name
        },
        ":t": {
          S: item.type
        }
      }
    }

    await this.ddbClient.send(new UpdateItemCommand(updateItemInput))
    return item
  }

  async CreateRequest(request: ProcessingItemRequest): Promise<ProcessingItem> {
    const id = (await KSUID.random()).string
    const item: ProcessingItem = {
      id,
      status: 'received',
      result: '',
      amount: request.amount,
      name: request.name,
      type: request.type
    }

    const marshalled = marshall(item)

    const putItemInput: PutItemCommandInput = {
      TableName: process.env.REQUESTTABLE,
      Item: marshalled
    }

    await this.ddbClient.send(new PutItemCommand(putItemInput))
    return item
  }
}