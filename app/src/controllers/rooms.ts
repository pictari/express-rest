import { Request, Response } from "express";
import { DynamoDBClient, GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const client : DynamoDBClient = new DynamoDBClient({
    credentials: {
        accessKeyId: process.env.PUBLICACCESSKEY as string,
        secretAccessKey: process.env.SECRETACCESSKEY as string
    }
});

export const getRoomsList = async (req: Request, res: Response) =>
{
    try {
        let input = {
            "TableName":"sample-data-with-sort",
            "ExpressionAttributeNames": {
                "#P": "Private"
            },
            "ExpressionAttributeValues": {
                ":b": {
                  "N": "0"
                }
            },
            "FilterExpression": "#P = :b",
            "ProjectionExpression":"RoomId, RoomName, HostName, CurrentCount, MaxPlayers"
        };

        let response = await client.send(new ScanCommand(input));
        let items = response.Items;
        if(items == null || items == undefined) {
            res.status(404).send(`Did not find any active public servers.`);
        } else {
            res.status(200).json(items);
        }

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

// frustrating fact about DynamoDB: they do not let you place any sort of index or composite primary key on a boolean
// therefore, the private field must be a number because scanning the table has bad side effects on a larger dataset
export const getRoomDetails  = async (req: Request, res: Response) =>
{
    let roomId: string = req.params.id;
    try {
        let input = {
            "TableName":"sample-data-with-sort",
            "Key": {
                "RoomId": {
                    "S":roomId
                },
                "Private": {
                    "N": "0"
                }
            }
        };

        let response = await client.send(new GetItemCommand(input));
        let item = response.Item;
        if(item == null || item == undefined) {
            res.status(404).send(`No room with ID ${roomId} exists.`);
        } else {
            res.status(200).json(item);
        }
    } catch(error) {
        if (error instanceof Error) {
            console.log(`Failure to retrieve details for room ${roomId}: ${error.message}`);
        }
        else {
            console.log(`Error: ${error}`);
        }
        res.status(400).send(`Failed to retrieve details for room ${roomId}`);
    }
}

export const getPrivateRoomDetails  = async (req: Request, res: Response) =>
    {
        let roomKey: string = req.params.key;
        try {
            // FilterExpression shouldn't need to be here according to official documentation, but omitting it causes an error to be thrown
            // does it add overhead? yes. is there an alternative? no.
            // I believe Padraig would call this a feature
            let input = {
                "TableName":"sample-data-with-sort",
                "Index":"JoinKey-index",
                "KeyConditionExpression": "JoinKey = :join",
                "ExpressionAttributeValues":{
                    ":join":{
                        "S":roomKey
                    }
                },
                "FilterExpression":"JoinKey = :join"
            };
    
            let response = await client.send(new ScanCommand(input));

            if(response == null || response == undefined || response.Items == undefined || response.Items == null) {
                res.status(404).send(`No room with key ${roomKey} exists.`);
            } else {
                let item = response.Items[0];
                res.status(200).json(item);
            }
        } catch(error) {
            if (error instanceof Error) {
                console.log(`Failure to retrieve details for room with key ${roomKey}: ${error.message}`);
            }
            else {
                console.log(`Error: ${error}`);
            }
            res.status(400).send(`Failed to retrieve details for room with key ${roomKey}`);
        }
    }