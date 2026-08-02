import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

function MessageList({ messages, currentUserId }) {

    const bottomRef = useRef(null);

    useEffect(() => {

        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        });

    }, [messages]);

    return (

        <div className="message-list">

            {messages.map((msg, index) => (

                <MessageItem
                    key={index}
                    userId={msg.user_id ?? msg.userId}
                    message={msg.message}
                    currentUserId={currentUserId}
                />

            ))}

            <div ref={bottomRef}></div>

        </div>
    );
}

export default MessageList;