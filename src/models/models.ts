"use strict";

import { Schema } from "@aws/dynamodb-data-marshaller";
import { JSONSchemaType } from "ajv"


export interface ProcessingItemRequest {
  type: string
  name: string
  amount: number
}
export interface ProcessingItem {
  id: string
  type: string
  name: string
  amount: number
  status: string
  result: string
}

export const ProcessingRequestSchema: JSONSchemaType<ProcessingItemRequest> = {
  type: "object",
  properties: {
    type: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1 },
    amount: { type: "number" },
  },
  required: ["type", "name", "amount"],
  additionalProperties: false
}

export const DynamoDBProcessingItemSchema: Schema = {
  id: { type: 'String', keyType: "HASH" },
  type: { type: 'String' },
  name: { type: 'String' },
  amount: { type: 'Number' },
  status: { type: 'String' },
  result: { type: 'String' },
}