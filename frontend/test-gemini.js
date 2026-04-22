const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyBmumMj65ITsHiRFL42YwWoXdyBKWpk-Yw");
async function run() {
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent("Hello");
    console.log(models);
  } catch (e) {
    console.error(e);
  }
}
run();
