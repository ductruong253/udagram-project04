import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
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
        private readonly todosIndexName = 'CreatedAtIndex') { }


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

    createTodo = async (todo: TodoItem): Promise<TodoItem[]> => {
        logger.log('info', 'Creating todo with payload: '.concat(JSON.stringify(todo)))
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()
        let todos = await this.getTodosByUserId(todo.userId)
        return todos
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
            ExpressionAttributeValues:{
                ":name": updateTodo.name,
                ":dueDate": updateTodo.dueDate,
                ":done": updateTodo.done
            },
            ExpressionAttributeNames: {
              "#name": "name"
            }
        }).promise()
    }

    async deleteTodoItem(userId: string, todoId: string): Promise<void> {
        await this.docClient.delete({
          TableName: this.todosTable,
          Key: {
            "userId": userId,
            "todoId": todoId
          }
        }).promise()
      }
}