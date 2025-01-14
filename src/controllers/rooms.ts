import { Request, Response } from "express";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client : DynamoDBClient = new DynamoDBClient({});

export const getRoomsList = async (req: Request, res: Response) =>
{
    try {
        const input = {
            "TableName":"sample-data",
            "ProjectionExpression":"RoomId, RoomName, HostName, CurrentCount, MaxPlayers"
        };

        const response = await client.send(new ScanCommand(input));

        res.status(200).json(response.Items);
    } catch(error) {
        if (error instanceof Error) {
            console.log(`Failure to retrieve a list of rooms: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(400).send(`Failed to retrieve a list of rooms.`);
    }
}