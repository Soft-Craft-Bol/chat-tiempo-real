import { useState, useEffect } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import "./ChatRoom.css";

var stompClient = null;
export default function ChatRoom() {
  const [publicChats, setPublicChats] = useState([]);
  const [privateChats, setPrivateChats] = useState(new Map());
  const [tab, setTab] = useState("CHATROOM");
  const [userData, setUserData] = useState({
    username: "",
    connected: false,
    message: "",
  });
  const [connectedUsers, setConnectedUsers] = useState([]);

  const handleValue = (e) => {
    const { value, name } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const registerUser = () => {
    if (!userData.username.trim()) return;

    let Sock = new SockJS("http://localhost:9090/ws");
    stompClient = over(Sock);
    stompClient.debug = (msg) => console.log(msg);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });

    // Suscripciones
    stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient.subscribe(
      `/user/${userData.username}/private`,
      onPrivateMessageReceived
    );
    stompClient.subscribe("/topic/connectedUsers", onConnectedUsersReceived);

    // Notificar que el usuario se ha conectado
    userJoin();
  };

  const onConnectedUsersReceived = (payload) => {
    try {
      // El backend envía un array de objetos {username: "nombre"}
      const usersData = JSON.parse(payload.body);
      const usernames = usersData.map((user) => user.username);
      setConnectedUsers(usernames);
    } catch (error) {
      console.error("Error parsing connected users:", error);
      setConnectedUsers([]);
    }
  };

  const userJoin = () => {
    const chatMessage = {
      senderName: userData.username,
      status: "JOIN",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    stompClient.send(
      "/app/user.connect",
      {},
      JSON.stringify({ username: userData.username })
    );
  };

  const onError = (err) => {
    console.error("Connection error:", err);
  };

  const onPublicMessageReceived = (payload) => {
    const payloadData = JSON.parse(payload.body);

    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.senderName)) {
          setPrivateChats((prev) =>
            new Map(prev).set(payloadData.senderName, [])
          );
        }
        break;
      case "MESSAGE":
        setPublicChats((prev) => [...prev, payloadData]);
        break;
      case "LEAVE":
        setConnectedUsers((prev) =>
          prev.filter((user) => user !== payloadData.senderName)
        );
        break;
      default:
        break;
    }
  };

  const onPrivateMessageReceived = (payload) => {
    const payloadData = JSON.parse(payload.body);
    setPrivateChats((prev) => {
      const newMap = new Map(prev);
      const messages = newMap.get(payloadData.senderName) || [];
      newMap.set(payloadData.senderName, [...messages, payloadData]);
      return newMap;
    });
  };

  const sendPublicMessage = () => {
    if (!userData.message.trim()) return;

    const chatMessage = {
      senderName: userData.username,
      message: userData.message,
      status: "MESSAGE",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    setUserData({ ...userData, message: "" });
  };

  const sendPrivateMessage = () => {
    if (!userData.message.trim()) return;

    const chatMessage = {
      senderName: userData.username,
      receiverName: tab,
      message: userData.message,
      status: "MESSAGE",
    };

    stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));

    // Actualizar el chat privado localmente
    setPrivateChats((prev) => {
      const newMap = new Map(prev);
      const messages = newMap.get(tab) || [];
      newMap.set(tab, [...messages, chatMessage]);
      return newMap;
    });

    setUserData({ ...userData, message: "" });
  };

  const handleUserDisconnect = () => {
    if (stompClient && userData.connected) {
      const chatMessage = {
        senderName: userData.username,
        status: "LEAVE",
      };
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      stompClient.send(
        "/app/user.disconnect",
        {},
        JSON.stringify({ username: userData.username })
      );
      stompClient.disconnect();
    }
  };

  useEffect(() => {
    return () => {
      handleUserDisconnect();
    };
  }, []);

  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li
                onClick={() => setTab("CHATROOM")}
                className={`member ${tab === "CHATROOM" && "active"}`}
              >
                ChatRoom
              </li>
              {connectedUsers
                .filter(
                  (username) => username && username !== userData.username
                )
                .map((username, index) => (
                  <li
                    key={index}
                    onClick={() => setTab(username)}
                    className={`member ${tab === username && "active"}`}
                  >
                    {username}
                  </li>
                ))}
            </ul>
          </div>

          {tab === "CHATROOM" ? (
            <div className="chat-content">
              <ul className="chat-messages">
                {publicChats.map((chat, index) => (
                  <li
                    key={index}
                    className={`message ${
                      chat.senderName === userData.username ? "self" : "other"
                    }`}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="sender-name">{chat.senderName}</div>
                    )}
                    <div className="message-content">
                      <div className="message-text">{chat.message}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="send-message">
                <input
                  type="text"
                  placeholder="Type a message"
                  className="input-message"
                  name="message"
                  value={userData.message}
                  onChange={handleValue}
                  onKeyPress={(e) => e.key === "Enter" && sendPublicMessage()}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPublicMessage}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-content">
              <ul className="chat-messages">
                {(privateChats.get(tab) || []).map((chat, index) => (
                  <li
                    key={index}
                    className={`message ${
                      chat.senderName === userData.username ? "self" : "other"
                    }`}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="sender-name">{chat.senderName}</div>
                    )}
                    <div className="message-content">
                      <div className="message-text">{chat.message}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="send-message">
                <input
                  type="text"
                  placeholder={`Message to ${tab}`}
                  className="input-message"
                  name="message"
                  value={userData.message}
                  onChange={handleValue}
                  onKeyPress={(e) => e.key === "Enter" && sendPrivateMessage()}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPrivateMessage}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <h2>Join Chat</h2>
          <input
            id="user-name"
            name="username"
            placeholder="Enter your name"
            value={userData.username}
            onChange={handleValue}
            onKeyPress={(e) => e.key === "Enter" && registerUser()}
          />
          <button type="button" onClick={registerUser}>
            Connect
          </button>
        </div>
      )}
    </div>
  );
}
