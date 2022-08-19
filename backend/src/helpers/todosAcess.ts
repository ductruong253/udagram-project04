import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createAttachmentPresignedUrl } from './attachmentUtils'
import { env } from 'process'
import { String } from 'aws-sdk/clients/batch'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')


// TODO: Implement the dataLayer logic
export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        // TODO: should be replaced with env.var after complete
        private readonly todosTable = env.TODOS_TABLE,
        private readonly todosIndexName = env.TODOS_CREATED_AT_INDEX) { }


    getTodosByUserId = async (userId: string): Promise<TodoItem[]> => {
        logger.log('info', 'Getting todo items for user with id: '.concat(userId))
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

    createTodo = async (todo: TodoItem): Promise<TodoItem> => {
        logger.log('info', 'Creating todo with payload: '.concat(JSON.stringify(todo)))
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()
        return todo
    }

    updateTodo = async (userId: string, todoId: string, updateTodo: UpdateTodoRequest): Promise<void> => {
        logger.log('info', 'Updating todo: '.concat(JSON.stringify({ ...updateTodo, userId, todoId })))
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "set #name=:name, dueDate=:dueDate, done=:done",
            ExpressionAttributeValues: {
                ":name": updateTodo.name,
                ":dueDate": updateTodo.dueDate,
                ":done": updateTodo.done
            },
            ExpressionAttributeNames: {
                "#name": "name"
            }
        }).promise()
    }

    deleteTodoItem = async (userId: string, todoId: string): Promise<void> => {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            }
        }).promise()
    }

    generateUploadURL = async (userId: string, todoId: string): Promise<String> => {
        const url = await createAttachmentPresignedUrl()
        //update the to do Item with newly created presign URL
        this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": url,
            }
        }, (err, data) => {
            if (err) {
                logger.log('error', 'Failed to create attachement presigned URL: '.concat(err.message))
                throw new Error(err.message)
            }
            logger.log('info', 'Created presign URL successfully: '.concat(JSON.stringify(data)))
        })
        return url
    }
}