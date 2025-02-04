import OpenAI from "openai";

//const messageArea = document.getElementById("messageArea");
//const chatInput = document.getElementById("chatInput");
//const sendButton = document.getElementById("sendButton");

async function sendMessagetoAI(userMessage) {

const completion = await openai.chat.completions.create({

    model: "gpt-4o-mini",
    messages:[
            { role:"system", content: "You are a helpful and friendly AI turtle who assists with studying. You know this user's habits, and are trying to help them learn and plan their studying in an optimal way to maximize their learning."},
            { role: "user", content: userMessage,},
    ],
    store: true,
});

alert(completion.choices[0].message);
}


//sendButton.addEventListener("click", () => {
    const userMessage = "return the word test";
    if (userMessage) {
        sendMessagetoAI(userMessage);
    }
//});

//chatInput.addEventListener("keypress", (event) => {
    if (true) {
        const userMessage = "return the word test;";
        if (userMessage) {
            sendMessagetoAI(userMessage);
        }
    }
//});