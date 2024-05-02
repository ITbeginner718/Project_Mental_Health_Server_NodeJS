const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios'); // Axios 모듈 추가

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        //http://localhost:5174 : 리액트(UI) url 
         origin: ["http://localhost:5173"], // 허용할 출처 목록
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('React(Client) is connected');

    socket.on('chat message', async (msg) => {
        console.log('Received message from React(client):', msg);

        try {
            // Rasa 서버로 메시지 전송
            // Rasa 서버 url
            const response = await axios.post('http://localhost:5005/webhooks/rest/webhook', {
                sender: "test_user", // sender ID 지정 (필요에 따라 조정)
                message: msg
            });

            console.log('Send message to Rasa:', msg);

            // Rasa로부터 받은 응답을 클라이언트로 전송
            if (response.data && response.data.length > 0) {
                try{
                    response.data.forEach((message) => {
                        console.log("Received message from Rasa:", message.text);
                        socket.emit('chat message', message.text);
                        console.log("Send message to React(Client):", message.text);
                    });
                }
                catch(error)
                {
                    console.error("Error communicating with React:", error)
                }
              
            }
        } catch (error) {
            console.error('Error communicating with Rasa:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('React(Client) disconnected');
    });
});

// nodejs 접속 포트 설정
server.listen(4800, () => {
    console.log('Rasa chatbot Node JS Server is listening on * Port4800');
});
