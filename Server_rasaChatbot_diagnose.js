const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios'); // Axios 모듈 추가

const app = express();
app.use(cors());

// 진단 질의-응답 데이터를 저장할 배열 선언

// 질의 데이터 리스트 
const diagnose_request_list = [];

// 응답 데이터(숫자) 리스트
const diagnose_response_number_list = [];

// 응답 데이터(텍스트) 리스트 
const diagnose_response_text_list = [];

// 진단 검사 결과값 전송
const diagnose_result = [];

// 진단 검사 데이터 패키징 

const diagnose_data_packaging =() =>
    {
        let dianose_data_package_list="result"+'@a';
        
        // 데이터 패키징 (검사 - 결과 )
        dianose_data_package_list+=diagnose_result[0]+'\n'+diagnose_result[1]+'@a';  

        // 데이터 패키징 (검사 질의-응답)
        diagnose_request_list.forEach(function(requestData, index) {
            dianose_data_package_list+=requestData+'\n'+diagnose_response_number_list[index]+'\n'+diagnose_response_text_list[index];
            
            if(diagnose_request_list.length !== (index+1))
                {
                    dianose_data_package_list+='@b';
                }
        });

        return dianose_data_package_list;   
    }

// 챗봇 질의 응답 리스트 초기화
const dignose_request_response_reset=()=>
    {
        console.log("진단 데이터 리셋");

        // 질의 데이터 리스트 
        diagnose_request_list.splice(0, diagnose_request_list.length);  
        // 응답 데이터 리스트 점수
        diagnose_response_number_list.splice(0, diagnose_response_number_list.length);    

        // 응답 데이터 리스트 텍스트
        diagnose_response_text_list.splice(0, diagnose_response_text_list.length); 

        // 진단 검사 결과값
        diagnose_result.splice(0, diagnose_result.length);        
    }

// 챗봇 질의 응답 리스트 받기
const diagnose_parsing_request_response_data =(message)=>
    {
        console.log("messageData:",message);
        const messageData = message;

        // request parsing
        if(messageData.indexOf("request") != -1)
            {
                try
                {
                    // 데이터 파싱
                    const parsingdata = messageData.split('\n');

                    // 질의 데이터 
                    const requestData = parsingdata[1];
                    console.log("requestData : " + parsingdata[1]);    
                    // 인덱스 
                    const requestDataIndex = Number(parsingdata[2]);        
                    console.log("requestDataIndex : " +  Number(parsingdata[2]));    

                    // request_list에 추가
                    diagnose_request_list[requestDataIndex] = requestData

                    console.log(diagnose_request_list[requestDataIndex]);
                }

                catch(error)
                {
                    console.log("error : " + error);    
                }

                return 1;
            }

        // response parsing_number
        else if(messageData.indexOf("response_number") != -1)
            {
                // 데이터 파싱
                const parsingdata = messageData.split('\n');
                    
                // 질의 데이터 
                const responseData = parsingdata[1];
                console.log("responseData : " + responseData);  

                // 인덱스 
                const responseDataIndex = Number(parsingdata[2]);        
                console.log("responseDataIndex : " + responseDataIndex);
                
                try
                {
                // request_list에 추가
                diagnose_response_number_list[responseDataIndex] = responseData

                console.log(diagnose_response_number_list[requestDataIndex]);
                }

                catch(error)
                {
                    console.log("error : " + error);    
                }

                return 1;
            }

             // response parsing_text
             else if(messageData.indexOf("response_text") != -1)
                {
                    // 데이터 파싱
                    const parsingdata = messageData.split('\n');
                        
                    // 질의 데이터 
                    const responseData = parsingdata[1];
                    console.log("responseData : " + responseData);  
    
                    // 인덱스 
                    const responseDataIndex = Number(parsingdata[2]);        
                    console.log("responseDataIndex : " + responseDataIndex);
                    
                    try
                    {
                    // request_list에 추가
                    diagnose_response_text_list[responseDataIndex] = responseData;
    
                    console.log(diagnose_response_text_list[requestDataIndex]);
                    }
    
                    catch(error)
                    {
                        console.log("error : " + error);    
                    }
    
                    return 1;
                }
        
        // 검사 진단 결과값 전송
        else if(messageData.indexOf("result") != -1)
            {
                // 데이터 파싱  message= f"{REQUEST}\a{message}\a{count}"
                const parsingdata = messageData.split('\n');
            
                // 결과 점수 
                const  resultDataNumber = parsingdata[1];

                // 결과 텍스트
                const resultDataText = parsingdata[2];        
                
                // diagnose_result 추가
                diagnose_result.push(resultDataNumber); 
                diagnose_result.push(resultDataText);

                // 배열 순회

                // 질의
                console.log("============================================== 결과 데이터 출력 ====================================================")

                diagnose_request_list.forEach(function(requestData, index) {
                    console.log(index+"번째 질의 데이터 : ",requestData);  
                });

                // 응답_점수
                diagnose_response_number_list.forEach(function(responseData, index) {
                    console.log(index+"번째 응답(number) 데이터 : "+responseData);
                }); 

                // 응답_텍스트
                diagnose_response_text_list.forEach(function(responseData, index) {
                console.log(index+"번째 응답(text) 데이터 : "+responseData);
                    }); 

                //결과
                diagnose_result.forEach(function(resultData, index) {
                    console.log(index+"번째 결과 데이터 : "+resultData);
                }); 

                return 2;
            }

        else
        {
            return 0;
        }
    }

const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        //http://localhost:5174 : 리액트(UI) url 
         origin: ["https://localhost:5173"], // 허용할 출처 목록
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
            const response = await axios.post('http://localhost:5004/webhooks/rest/webhook', {
                sender: "test_user", // sender ID 지정 (필요에 따라 조정)
                message: msg
            });

            console.log('Send message to Rasa:', msg);

            // Rasa로부터 받은 응답을 클라이언트로 전송
            if (response.data && response.data.length > 0) {

                try{
                    response.data.forEach((message) => {
                        console.log("Received message from Rasa:", message.text);
                        
                        // 저장할 데이터 parsing
                        const isDiagnoseRequestResponseData =  diagnose_parsing_request_response_data(message.text);   

                        // 데이터를 저장할 진단 검사 "질의 및 응답" 데이터가 들어오지 않았을 경우(false)에만 데이터 전송     
                        if(isDiagnoseRequestResponseData===0)
                            {
                                // rasa에서 받은 데이터를 react로 전송
                                socket.emit('chat message', message.text);
                                console.log("Send message to React(Client):", message.text);
                            }

                        // 진단 검사 결과 데이터 전송 
                        if(isDiagnoseRequestResponseData===2)
                            {
                                // 진단 데이터셋 페키지
                                packageData = diagnose_data_packaging();

                                // 진단 검사 결과 전송  
                                socket.emit('chat message', packageData);

                                // 리스트 리셋
                                dignose_request_response_reset();
                            }
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

        // 리스트 리셋
        dignose_request_response_reset();

        console.log('React(Client) disconnected');
    });
});

// nodejs 접속 포트 설정
server.listen(4805, () => {
    console.log('Rasa chatbot Node JS Server is listening on * Port 4805');
});
