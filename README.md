# Async Processor
An API pattern that uses SQS queues and a DynamoDB table to track requests and process them asynchronously. The sender can retrieve the status of the request and result at their own leisure.

### TODO

- [ ] create Request client to centralize API operations
- [ ] use custom dynamodb table schema
- [ ] use AJV for object/request validation