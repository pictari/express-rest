import { Request, Response } from "express";
import { DynamoDBClient, GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

dotenv.config();

// must use explicit credentials for Kubernetes
const client : DynamoDBClient = new DynamoDBClient({
    region: process.env.DYNAMOREGION as string,
    credentials: {
        accessKeyId: process.env.PUBLICACCESSKEY as string,
        secretAccessKey: process.env.SECRETACCESSKEY as string
    }
});

/**
 * Fetches available rooms to populate the public server list. The exact rooms fetched depend on
 * DynamoDB's engine, which is fine for our purpose.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getRoomsList = async (req: Request, res: Response) =>
{
    try {
        // only public rooms (Private = 0) and waiting (Status = 0) are eligible for the server list
        let input = {
            "TableName":"sample-data-with-sort",
            "ExpressionAttributeNames": {
                "#P": "Private",
                "#S": "Status"
            },
            "ExpressionAttributeValues": {
                ":b": {
                  "N": "0"
                },
                ":s": {
                    "N": "0"
                  }
            },
            "FilterExpression": "#P = :b and #S = :s",
            // return ID (used for further data retrieval), name, ID of the host, and current numeric metrics
            // as they appear in the server list
            "ProjectionExpression":"RoomId, RoomName, HostId, CurrentCount, MaxPlayers"
        };

        // use DynamoDB Scan as the # of rooms retrieved doesn't matter
        let response = await client.send(new ScanCommand(input));
        let items = response.Items;
        if(items == null || items == undefined) {
            // 404 here doesn't indicate an issue for either server or client
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
        res.status(500).send(`Failed to retrieve a list of rooms.`);
    }
}

// frustrating fact about DynamoDB: they do not let you place any sort of index or composite primary key on a boolean
// therefore, the private field must be a number because Scanning the table has bad side effects on a larger dataset

/**
 * Fetches details of the requested public room.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getRoomDetails  = async (req: Request, res: Response) =>
{
    let roomId: string = req.params.id;
    // make sure that the room to retrieve is public (Private = 0)
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

        // GetItemCommand is not unpredictable (unlike Scan) so it's a better
        // option for individual retrieval
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
        res.status(500).send(`Failed to retrieve details for room ${roomId}`);
    }
}

/**
 * Fetches details of the requested private room.
 * 
 * @param req All contents of a HTTP request.
 * @param res The response to build/send to the end user.
 */
export const getPrivateRoomDetails  = async (req: Request, res: Response) =>
    {
        let roomKey: string = req.params.key;
        try {
            // FilterExpression shouldn't need to be here according to official documentation, but omitting it causes an error to be thrown
            // does it add overhead? yes. is there an alternative? no.
            // I believe Padraig would call this a feature
            let input = {
                // rely on a GSI to retrieve data securely (without the potential for Dynamo to fail in getting the right room)
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
            // confusingly, you must use Scan when you're retrieving based on a GSI
            // but due to the nature of GSIs, this kind of Scan shouldn't be unpredictable
            let response = await client.send(new ScanCommand(input));

            if(response == null || response == undefined || response.Items == undefined || response.Items == null) {
                res.status(404).send(`No room with key ${roomKey} exists.`);
            } else {
                // it retrieves an array by default so just choose the first object
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
            res.status(500).send(`Failed to retrieve details for room with key ${roomKey}`);
        }
    }