import { useState, useRef, useEffect } from 'react';
import { IoIosAttach } from 'react-icons/io';
import './ChatBox.css';

const ChatBox = () => {
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversation, setConversation] = useState([]);
    const fileInputRef = useRef(null);
    const chatBodyRef = useRef(null);
    const [fileUploaded, setFileUploaded] = useState(false);
    const [error, setError] = useState('');

    // Handle file upload
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileUploaded(false);  // File needs to be re-uploaded
        }
    };

    const handleMessageChange = (event) => {
        setMessage(event.target.value);
    };

    // Remove file-related restriction; allow sending message without file
    const isSendDisabled = !message || loading;

    // Scroll to bottom of chat when a new message is added
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [conversation]);

    // Send the question and file(s) to the server
    const getResponse = async () => {
        if (!message && !file) return;

        setLoading(true);
        setError('');
        const formData = new FormData();

        // Only append file for the first upload or when a new file is uploaded
        if (!fileUploaded && file) {
            formData.append('file', file);  // Send the new file
        }
        formData.append('question', message);  // Send the question

        try {
            // Use localhost URL
            const res = await fetch('http://localhost:3001/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                const assistantMessage = data.answer;

                setConversation((prev) => [
                    ...prev,
                    { role: 'user', content: message },
                    { role: 'assistant', content: assistantMessage },
                ]);

                setResponse(assistantMessage);

                if (!fileUploaded && file) {
                    setFileUploaded(true);  // Mark that the file has been uploaded
                }
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error fetching response from server:', error);
            setError('Error fetching response: ' + error.message);
            setResponse('Error fetching response');
        } finally {
            setLoading(false);
        }

        setMessage('');
        if (!fileUploaded) setFile(null);
        fileInputRef.current.value = ''; // Clear the file input
    };

    return (
        <div className="chatbox-container">
            <div className="chatbox-header">
                <span>ChatBox POC</span>
            </div>
            <div className="chatbox-body" ref={chatBodyRef}>
                {conversation.map((msg, index) => (
                    <div key={index} className={msg.role}>
                        <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
                    </div>
                ))}
                {error && <div className="error">{error}</div>}
            </div>
            <div className="chatbox-footer">
                <div className="input-section">
                    <input
                        type="text"
                        placeholder="Ask me anything..."
                        value={message}
                        onChange={handleMessageChange}
                        className="message-input"
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        id="file-upload"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload" className="icon-button">
                        <IoIosAttach />
                    </label>
                    {file && !fileUploaded && <span className="file-name">{file.name} (Ready to upload)</span>}
                    {fileUploaded && <span className="file-name">File uploaded successfully</span>}

                    <button
                        onClick={getResponse}
                        disabled={isSendDisabled || loading}
                        className={`send-button ${isSendDisabled || loading ? 'disabled' : ''}`}
                    >
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;
