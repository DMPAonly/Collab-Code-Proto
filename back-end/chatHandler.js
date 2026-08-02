// import { saveMessage } from "../services/chatService.js";
import { WebSocket } from "ws";

export async function handleChat(message) {
    console.log("Chat received:", message);

    //const room = rooms.get(message.workspaceId);
    const room = message.workspaceId;
    console.log(rooms);
    console.log(room);



    if (!room) {
        return;
    }

    try {
        // await saveMessage(
        //     message.workspaceId,
        //     message.userId,
        //     message.message
        // );

        room.forEach((user) => {
            if (user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(JSON.stringify({
                    type: "chat",
                    userId: message.userId,
                    message: message.message
                }));
            }

        });
    } catch (error) {
        console.error("Error saving message:", error);
    }
}