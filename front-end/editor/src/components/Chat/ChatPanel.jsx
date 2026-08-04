import { useEffect,useState,useRef } from "react";
// import {createSocket} from "../../service/websocket";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ACTIONS from "../../Actions";

function ChatPanel({socket, roomId, userId}) {

    const [messages, setMessages] = useState([]);

    // const socketRef = useRef(null);

    useEffect(() => {

    // const socket = createSocket();

    // socketRef.current = socket;

    // socket.onopen = () => {

    //     console.log("WebSocket connected");

    //     socket.send(JSON.stringify({
    //         type: "join",
    //         workspaceId,
    //         userId
    //     }));

    // };

    // socket.onmessage = (event) => {

    //     const data = JSON.parse(event.data);

    //     console.log("Message received:", data);

    //     if (data.type === "history") {

    //         setMessages(data.messages);

    //     }

    //     if (data.type === "chat") {

    //         setMessages((previousMessages) => [
    //             ...previousMessages,
    //             data
    //         ]);

    //     }

    // };

    // socket.onclose = () => {

    //     console.log("WebSocket disconnected");

    // };

    // return () => {

    //     socket.close();

    // };

//}, [roomId, userId]);

        if (!socket) return; // Wait until socket state is populated

        const handleReceiveMessage = (data) => {
            setMessages((prev) => [...prev, data]);
        };

        const handleChatHistory = (history) => {
            setMessages(history);
        };

        socket.on('chat-history', handleChatHistory);
        socket.on(ACTIONS.RECEIVE_MESSAGE, handleReceiveMessage);

        return () => {
            socket.off('chat-history', handleChatHistory);
            socket.off(ACTIONS.RECEIVE_MESSAGE, handleReceiveMessage);
        };
    }, [socket]);

    function handleSend(message) {

    //     if (
    //     socketRef.current &&
    //     socketRef.current.readyState === WebSocket.OPEN
    // ) {

    //     socketRef.current.send(JSON.stringify({
    //         type: "chat",
    //         workspaceId,
    //         userId,
    //         message
    //     }));

    // }

    //     const newMessage = {

    //         userId: userId,
    //         message: message

    //     };
        if (!socket || !message.trim()) return;

        socket.emit(ACTIONS.SEND_MESSAGE, {
            roomId,
            userId,
            message,
            timestamp: new Date().toISOString(),
        });

    }

    return (

        <div className="chat-container">

            <MessageList
                messages={messages}
                currentUserId={userId}
            />

            <ChatInput
                onSend={handleSend}
            />

        </div>

    );

}

export default ChatPanel;