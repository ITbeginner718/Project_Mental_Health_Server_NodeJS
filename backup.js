import YOUTUBE_API_KEY from './webCrawlingApiKey.js';

// 환경 변수 설정
process.env.YOUTUBE_API_KEY = YOUTUBE_API_KEY;

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

    socket.on('community message', async (msg) => {
        console.log('WebCrawling:Received message from React(client):', msg);
        try {

            // let response;

            // // 함수 실행 및 결과 출력
            // await getYoutubeDatas(msg).then(
            //     (data) => {
            //         response = getSearchedVideos(data);
            //     }
            // )
            //     .catch(
            //         error => console.error(error)
            //     );



            try {
                const data = await getYoutubeDatas(msg);
                const response = await getSearchedVideos(data); // 비동기 함수이므로 여기에 await 추가

                socket.emit('community message', response);
            }

            catch (error) {
                console.error("Error communicating with React:", error)
            }
        }

        catch (error) {
            console.error('Error communicating with Rasa:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('WebCrawling:React(Client) disconnected');
    });
});

// nodejs 접속 포트 설정
server.listen(4900, () => {
    console.log('Node JS Server is listening on * Port4900');
});

//========================YouYube API=========================================

//YouTube API 호출
const getYoutubeDatas = async (msg) => {
    const params = {
        key: process.env.YOUTUBE_API_KEY,
        q: msg,
        part: "snippet",
        type: "video",
        maxResults: 8,
        fields: "items(id, snippet(title))",
        videoEmbeddable: true,
    };

    const youtubeDatas = axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
            params,
        }
    );
    return youtubeDatas;
}

//호출된 API 결과값 JSON 
const getSearchedVideos = async (youtubeDatas) => {
    const searchedVideos = [];
    const videoLists = youtubeDatas.data.items;
    videoLists.forEach((element) => {
        const videoId = element.id.videoId;
        const title = element.snippet.title;
        searchedVideos.push({ videoId, title });
    });
    return searchedVideos;
}