"use strict";

export type ProcessingRequestType = "TYPE1" | "TYPE2" | "TYPE3"

export interface ProcessingRequest {
  id: string
  type: ProcessingRequestType
  name: string
  amount: number
}