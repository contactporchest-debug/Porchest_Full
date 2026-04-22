const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyBmumMj65ITsHiRFL42YwWoXdyBKWpk-Yw");
async function run() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBmumMj65ITsHiRFL42YwWoXdyBKWpk-Yw`);
    const data = await response.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
run();
