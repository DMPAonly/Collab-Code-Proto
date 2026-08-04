import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';
import STARTER_TEMPLATES from '../StartTemplate';
import ChatPanel from '../components/Chat/ChatPanel';

const EditorPage = () => {
    const languagesId = {'javascript': 63, 'python': 71, 'clike': 50, 'clike-cpp':54, 'clike-java':62, 'clike-csharp':51}
    const socketRef = useRef(null);
    const codeRef = useRef(STARTER_TEMPLATES['javascript'] || '');
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [output, setOutput] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [language, setLanguage] = useState('javascript');
    const [socket, setSocket] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
    let isMounted = true;

    const init = async () => {
        const socket = await initSocket();
        
        // If component unmounted while waiting for connection, disconnect immediately
        if (!isMounted) {
            socket.disconnect();
            return;
        }

        socketRef.current = socket;
        setSocket(socket);
        socketRef.current.on('connect_error', (err) => handleErrors(err));
        socketRef.current.on('connect_failed', (err) => handleErrors(err));

        function handleErrors(e) {
            console.log('socket error', e);
            toast.error('Socket connection failed, try again later.');
            reactNavigator('/');
        }

        socketRef.current.emit(ACTIONS.JOIN, {
            roomId,
            username: location.state?.username,
        });

        // Listening for joined event
        socketRef.current.on(
            ACTIONS.JOINED,
            ({ clients, username, socketId }) => {
                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room.`);
                    console.log(`${username} joined`);
                }
                setClients(clients);
                socketRef.current?.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current,
                    socketId,
                });
            }
        );

        socketRef.current.on(ACTIONS.OUTPUT_CHANGE, ({ output }) => {
            setOutput(output);
        });

        socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language: remoteLang }) => {
            if (remoteLang) {
                setLanguage(remoteLang);
            }
        });

        // Listening for disconnected
        socketRef.current.on(
            ACTIONS.DISCONNECTED,
            ({ socketId, username }) => {
                toast.success(`${username} left the room.`);
                setClients((prev) => {
                    return prev.filter(
                        (client) => client.socketId !== socketId
                    );
                });
            }
        );
    };

    init();

    return () => {
        isMounted = false;
        socketRef.current?.disconnect();
        socketRef.current?.off(ACTIONS.JOINED);
        socketRef.current?.off(ACTIONS.OUTPUT_CHANGE);
        socketRef.current?.off(ACTIONS.LANGUAGE_CHANGE);
        socketRef.current?.off(ACTIONS.DISCONNECTED);
    };
}, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    async function runCode() {
        const code = codeRef.current;

        if (!code || code.trim() === '') {
            toast.error('Code cannot be empty!');
            return;
        }

        setIsExecuting(true);
        
        const loadingMessage = 'Executing code, please wait...';
        setOutput(loadingMessage);

        // Broadcast "Executing..." state to everyone in the room
        socketRef.current?.emit(ACTIONS.OUTPUT_CHANGE, {
            roomId,
            output: loadingMessage,
        });

        try {
            const response = await fetch('https://execution-service-9l8e.onrender.com/api/execution/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceCode: code,
                    languageId: languagesId[language], // 63 = JavaScript (or 71 for Python)
                    roomId: roomId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }

            const data = await response.json();

            let finalOutput = '';
            if (data.error && data.error.trim() !== '') {
                finalOutput = `Error:\n${data.error}`;
            } else if (data.output) {
                finalOutput = data.output;
            } else {
                finalOutput = 'Program executed with no output.';
            }

            // Set local state
            setOutput(finalOutput);

            // Broadcast final output to everyone in the room!
            socketRef.current?.emit(ACTIONS.OUTPUT_CHANGE, {
                roomId,
                output: finalOutput,
            });

            toast.success('Execution completed!');
        } catch (err) {
            console.error('Execution Error:', err);
            const errorMsg = `Failed to execute code: ${err.message}`;
            
            setOutput(errorMsg);
            
            socketRef.current?.emit(ACTIONS.OUTPUT_CHANGE, {
                roomId,
                output: errorMsg,
            });

            toast.error('Execution failed.');
        } finally {
            setIsExecuting(false);
        }
    }

    // Handle language change
    const handleLanguageChange = (e) => {
        const selectedLang = e.target.value;
        setLanguage(selectedLang);
        
        // Optional: Reset starter template when switching languages
        const template = STARTER_TEMPLATES[selectedLang] || '';
        codeRef.current = template;

        socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code: template,
        });

        socketRef.current?.emit(ACTIONS.LANGUAGE_CHANGE, {
            roomId,
            language: selectedLang,
        });
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                    {/* Language Dropdown Selector */}
                    <div className="languageSelectGroup">
                        <label htmlFor="languageSelect">Language</label>
                        <select
                            id="languageSelect"
                            className="languageSelect"
                            value={language}
                            onChange={handleLanguageChange}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="clike">C</option>
                            <option value="clike-cpp">C++</option>
                            <option value="clike-java">Java</option>
                            <option value="clike-csharp">C#</option>
                        </select>
                    </div>
                </div>
                <button className="btn runBtn" onClick={runCode} disabled={isExecuting}>
                    {isExecuting ? 'Running...' : 'Run'}
                </button>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    language={language}
                    initialCode={STARTER_TEMPLATES[language]}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>
            {/* Blank Output Screen Beside Editor */}
            <div className="outputScreen">
                <pre>{output}</pre>
                {/* Floating Chat Overlay */}
                <div className={`floatingChatContainer ${isChatOpen ? 'expanded' : 'minimized'}`}>
                    <div className="chatHeader" onClick={() => setIsChatOpen((prev) => !prev)}>
                        <span className="chatTitle">💬 Project Chat</span>
                        <button className="toggleBtn">{isChatOpen ? '▼' : '▲'}</button>
                    </div>

                    {/* Completely unmount chat body when minimized to prevent height overflow */}
                        <div className="chatBody">
                            <ChatPanel socket={socket} roomId={roomId} userId={location.state?.username} />
                        </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
