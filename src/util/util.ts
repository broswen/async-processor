"use strict";


export function createError(message: string, status: number) {
  return {
    statusCode: status,
    body: JSON.stringify({
      message
    })
  }
}