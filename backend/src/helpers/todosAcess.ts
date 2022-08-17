import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
// import { TodoUpdate } from '../models/TodoUpdate';

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')


// TODO: Implement the dataLayer logic
export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        // TODO: should be replaced with env.var after complete
        private readonly todosTable = 'Todos-dev',
        private readonly todosIndexName = 'createdAt') { }


    async getTodosByUserId(userId: string): Promise<TodoItem[]> {
        logger.log('Getting todo items for user with id: ', userId);
        let todos: TodoItem[]

        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosIndexName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        todos = result.Items as TodoItem[]
        return todos
    }

    async createTodo(todo: TodoItem): Promise<TodoItem[]> {
        logger.log('Creating todo with payload: ', JSON.stringify(todo))
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()
        let todos = await this.getTodosByUserId(todo.userId)
        return todos
    }

}