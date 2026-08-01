import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike'; // Handles C, C++, Java, C#
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

// Map dropdown selections to CodeMirror mode names/MIMEs
    const MODE_MAP = {
        javascript: 'javascript',
        python: 'python',
        clike: 'text/x-csrc',        // C
        'clike-cpp': 'text/x-c++src', // C++
        'clike-java': 'text/x-java',  // Java
        'clike-csharp': 'text/x-csharp', // C#
    };

const Editor = ({ socketRef, roomId, onCodeChange, language = 'javascript', initialCode = '' }) => {

    const editorRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        async function init() {
            if (!editorRef.current && textareaRef.current) {
            editorRef.current = Codemirror.fromTextArea(textareaRef.current, {
                mode: MODE_MAP[language] || 'javascript',
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            });

            // Set initial template content
            if (initialCode) {
                editorRef.current.setValue(initialCode);
            }

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        }
        init();
    }, []);

    // Update Mode AND Set Template Code when language changes
    useEffect(() => {
        if (editorRef.current) {
            const mode = MODE_MAP[language] || 'javascript';
            editorRef.current.setOption('mode', mode);

            // FIX: If initialCode changes along with language, load the new template
            if (initialCode && editorRef.current.getValue() !== initialCode) {
                editorRef.current.setValue(initialCode);
            }
        }
    }, [language, initialCode]);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current?.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);

    return <textarea ref={textareaRef} id="realtimeEditor"></textarea>;
};

export default Editor;
