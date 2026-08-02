function MessageItem({ userId, message, currentUserId }) {

    const isMine = Number(userId) === Number(currentUserId);

    return (
        <div className={isMine ? "message my-message" : "message other-message"}>
            <strong>{isMine ? "You" : `User ${userId}`}</strong>
            <p>{message}</p>
        </div>
    );

}

export default MessageItem;