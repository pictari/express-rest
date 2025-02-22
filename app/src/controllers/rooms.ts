import { Request, Response } from "express";
import { DynamoDBClient, GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

const client : DynamoDBClient = new DynamoDBClient({});

export const getRoomsList = async (req: Request, res: Response) =>
{
    try {
        let input = {
            "TableName":"sample-data",
            "ExpressionAttributeNames": {
                "#P": "Private"
            },
            "ExpressionAttributeValues": {
                ":b": {
                  "BOOL": false
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


export const getRoomDetails  = async (req: Request, res: Response) =>
{
    let roomId: string = req.params.id;
    try {
        let input = {
            "TableName":"sample-data",
            "ExpressionAttributeNames": {
                "#P": "Private"
            },
            "Key": {
                "RoomId": {
                    "S":roomId
                },
                "#P": {
                    "BOOL":false
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
        let roomId: string = req.params.id;
        let roomKey: string = req.params.key;
        try {
            let input = {
                "TableName":"sample-data",
                "ExpressionAttributeValues": {
                    ":p": {
                      "S": roomKey
                    }
                },
                "FilterExpression": "PrivateKey = :p"
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
                console.log(`Failure to retrieve details for room ${roomId}: ${error.message}`);
            }
            else {
                console.log(`Error: ${error}`);
            }
            res.status(400).send(`Failed to retrieve details for room ${roomId}`);
        }
    }