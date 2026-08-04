function MessageItem({ userId, message, currentUserId }) {

    const isMine = userId === currentUserId;

    return (
        <div className={isMine ? "message my-message" : "message other-message"}>
            <strong>{isMine ? "You" : `${userId}`}</strong>
            <p>{message}</p>
        </div>
    );

}

export default MessageItem;