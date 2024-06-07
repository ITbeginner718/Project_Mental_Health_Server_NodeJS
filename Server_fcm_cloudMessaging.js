const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios'); // Axios 모듈 추가

const app = express();

const admin = require("firebase-admin");

const serviceAccount = require("./project-mentalcare-firebase-adminsdk-afk11-a85b080173.json");

// 토큰 등록 성공 키워드 

const TOKEN_REGISTER_SUCCESS = "success";

const PUSH_ALARM_SUCCESS = "success_alarm";

// admin-sdk 초기화
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 응원의 힘 
const quotes = [
    {
        summary: "앙: 단팥 인생 이야기",
        title: "짧고 좋은 글귀",
        number: "1003"
    },


    {
        summary: "외로운 것들에 지지 않으려면",
        title: "짧고 좋은 글귀",
        number: "1005"
    },

    {
        summary: "오늘 하루가 어땠나요?",
        title: "감정 일기를 통해 당신의 기분을 알려주세요.",
        number: "1000",
        url: `https://localhost:5173/admin/diary`
    },
    {
        summary: "안녕, 나의 모든 하루",
        title: "위로가 되는 글귀",
        number: "1002"
    },
    {
        summary: "오늘은 자신에게 따뜻하게 대해줬나요?",
        title: "그렇다면 커뮤니티 게시판에 여러분의 자신의 경험을 작성해주세요.",
        number: "1000",
        url: `https://localhost:5173/admin/board`
    },

    {
        summary: "심적으로 힘든 고민이 있나요?",
        title: "저와 같이 대화해봐요!",
        number: "1000",
        url: `https://localhost:5173/admin/chatbot`
    },
    {
        summary: "죽은 왕녀를 위한 파반느",
        title: "위로가 되는 글귀",
        number: "1004"
    },
    {
        summary: "지금은 우울감에 괜찮으신가요?",
        title: "저와 같이 검사 해봐요!",
        number: "1000",
        url: `https://localhost:5173/admin/chatbot_diagnose`
    },
    {
        summary: "고민 중독자들에게",
        title: "짧고 좋은 글귀",
        number: "1001",
    },

]

// 토큰 배열
const registrationTokens = [

];


// 토큰 등록 성공 메시지 전송
const pushTokenRegistrationSuccess = () => {
    console.log("알림 토큰 등록 성공 메시지 전송");

    // 알림 데이터 설정
    const message = {

        notification: {
            title: `Nofication Permission`,
            body: `알림 설정이 등록 되었어요`,
        },

        // token: 
        topic: "notification",
    };

    console.log("햇살 알림 전송");

    admin.messaging().send(message)
        .then((response) => {
            console.log('토큰 등록 성공 메시지 전공 완료:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}

// 진단 결과 메시지 전송 (비동기)
const pushDiagnoseResult = async (pushMessage) => {
    console.log("20초 후 진단 결과 메시지 전송");

    setTimeout(async () => {

        // 알림 데이터 설정
        const message = {

            notification: {
                title: `AI챗봇 마음e`,
                body: `${pushMessage}`,
            },

            webpush: {
                fcm_options: {
                    // 위로의 말 출력
                    link: `https://localhost:5173`,
                }
            },


            topic: "notification",
        };

        console.log("햇살 알림 전송");

        try {
            const response = await admin.messaging().send(message);
            console.log('진단검사결과 알림 완료:', response);
        }

        catch (error) {
            console.log('Error sending message:', error);
        }
    }, 20000);
}



// 토큰 주제 구독 
const subcribeToTopic = async (tokens) => {
    // Subscribe the devices corresponding to the registration tokens to the
    // topic.

    // 주제 구독
    const result = await admin.messaging().subscribeToTopic(tokens, "notification")

    if (result) {
        // See the MessagingTopicManagementResponse reference documentation
        // for the contents of response.
        console.log('Successfully subscribed to topic:', result);

        return TOKEN_REGISTER_SUCCESS;
    }

    else {
        console.log("토큰 등록 실패");
        return "fail";
    }
}



// 토큰 등록 및 알림 요청
const parsing_response_data = async (message) => {

    // 토큰 등록 요청   
    if (message.indexOf("token") !== -1) {
        // 데이터 파싱
        const messageParsing = message.split('@a');

        // 0:token 1:token 값
        const token = messageParsing[1];

        console.log("token:", token);

        // 토큰 배열이 0이거나 현재 토큰이 등록이 되어 있는지 확인

        // 토큰값이 있으면 true 없으면 undefined
        const isTokenInArray = registrationTokens.find((element) => {
            if (element === token) {
                console.log("이미 등록된 토큰:", token);
                return true;
            }
        })

        if (registrationTokens.length === 0 || !isTokenInArray) {
            // 토큰 추가
            registrationTokens.push(token);
            console.log("토큰 추가");

            // 토큰 등록 
            const isSubcribeToTopic = await subcribeToTopic(registrationTokens);

            return isSubcribeToTopic;
        }

        else {
            console.log("토큰이 이미 등록되어 있습니다.");
            return;
        }
    }

    // 진단 검사 결과 알림 요청
    else if (message.indexOf("diagnose") !== -1) {

        // 데이터 파싱
        const messageParsing = message.split('@a');

        // 0:token 1:pushMessage 값
        const pushMessage = messageParsing[1];

        console.log("pushMessage:", pushMessage);

        pushDiagnoseResult(pushMessage);

        return PUSH_ALARM_SUCCESS;
    }

    else {
        console.log("알림 요청이 올바르지 않습니다.");
        return "";
    }

}


// 서버 실행
const server = http.createServer(app);

const io = require('socket.io')(server, {
    cors: {
        origin: ["https://localhost:5173"], // 허용할 출처 목록
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('FCM:React(Client) is connected');

    // 메시지 수신
    socket.on('chat message', async (msg) => {
        console.log('Received Notification message from React(client):', msg);

        // 메시지 Parsing
        const result = await parsing_response_data(msg);

        console.log("result:", result);

        if (result === TOKEN_REGISTER_SUCCESS) {
            // 메시지 전송 및 알림 전송      

            // 알림 전송
            pushTokenRegistrationSuccess();

            // 메시지 전송 
            try {
                socket.emit('chat message', TOKEN_REGISTER_SUCCESS);
                console.log("Send message to React(Client):", "알림 등록이 완료되었습니다.");
            }

            catch (error) {
                console.error("Error communicating with React:", error)
            }

        }

        else if (result === PUSH_ALARM_SUCCESS) {

            // 메시지 전송 
            try {
                socket.emit('chat message', "30초 후 진단결과 피드백를 전송합니다.");
                console.log("Send message to React(Client):", "알림 예약이 완료되었습니다.");
            }

            catch (error) {
                console.error("Error communicating with React:", error)
            }

        }

    });

    socket.on('disconnect', () => {
        console.log('FCM:React(Client) disconnected');
    });
});

// 시간 마다 알림 전송 요청
setInterval(() => {

    console.log("햇살 알림 전송 요청");

    // 예외 처리
    if (registrationTokens.length === 0) {
        console.log("토큰이 없습니다.");
        return;
    }

    // 랜덤 명언 가져오기
    const index = Math.floor(Math.random() * quotes.length);
    // 분류: 명언, 홍보

    const todaysQuote = quotes[index];
    const id = todaysQuote.number;

    // 홍보 
    if (id === "1000") {
        // 알림 데이터 설정
        const message = {
            notification: {
                title: ` 마음e: ${todaysQuote.summary}`,
                body: `${todaysQuote.title}`,
            },

            webpush: {
                fcm_options: {
                    // 위로의 말 출력
                    link: `${todaysQuote.url}`,
                }
            },
            // token: 
            topic: "notification",
        };


        admin.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });

    }

    // 위로의 말
    else {
        // 알림 데이터 설정
        const message = {
            notification: {
                title: `오늘의 햇살 알림${todaysQuote.number}`,
                body: `${todaysQuote.title}:${todaysQuote.summary}`,
            },

            webpush: {
                fcm_options: {
                    // 위로의 말 출력
                    link: `https://localhost:5173/admin/notification/${id}`,
                }
            },
            // token: 
        };


        admin.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });

    }

    // 1초 
}, 15000);

// nodejs 접속 포트 설정
server.listen(4810, () => {
    console.log('Cloud Messaging Server is listening on * Port 4810');
});

