import { useState } from "react";

function ChatInput({ onSend }) {

    const [message, setMessage] = useState("");

    function handleSend() {

        if (message.trim() === "") {
            return;
        }

        onSend(message);

        setMessage("");

    }

    return (

        <div className="chat-input">

            <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                    if(event.key === "Enter"){
                        handleSend();
                    }
                }}
            />

            <button onClick={handleSend}>
                Send
            </button>

        </div>

    );

}

export default ChatInput;