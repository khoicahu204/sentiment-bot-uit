/*
 * Đây là code cho bot phân tích cảm xúc.
 */

const { ActivityHandler } = require('botbuilder');
const { TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics');

// ----- THAY THẾ THÔNG TIN CỦA BẠN VÀO ĐÂY -----
const textAnalyticsEndpoint = process.env.TEXT_ANALYTICS_ENDPOINT;// Dán Endpoint của bạn vào đây
const textAnalyticsKey = process.env.TEXT_ANALYTICS_KEY;// Dán Key 1 của bạn vào đây
// ---------------------------------------------

class SentimentBot extends ActivityHandler {
    constructor() {
        super();

        // Khởi tạo Text Analytics client
        const credentials = new AzureKeyCredential(textAnalyticsKey);
        const client = new TextAnalyticsClient(textAnalyticsEndpoint, credentials);

        // Xử lý khi có tin nhắn (onMessage)
        this.onMessage(async (context, next) => {
            const inputText = context.activity.text;

            // Chỉ phân tích nếu có văn bản
            if (inputText) {
                try {
                    // Chuẩn bị tài liệu để gửi đi
                    const documents = [inputText];
                    // Gọi API
                    const results = await client.analyzeSentiment(documents);

                    let sentimentResponse = 'Tôi không thể phân tích được cảm xúc của bạn.';

                    // Xử lý kết quả trả về
                    if (results && results.length > 0 && !results[0].error) {
                        const sentiment = results[0].sentiment;
                        const scores = results[0].confidenceScores;

                        // Tạo câu trả lời
                        sentimentResponse = `Tôi phân tích thấy cảm xúc của bạn là: "${ sentiment }".
                        \n- Tích cực: ${ (scores.positive * 100).toFixed(2) }%
                        \n- Trung tính: ${ (scores.neutral * 100).toFixed(2) }%
                        \n- Tiêu cực: ${ (scores.negative * 100).toFixed(2) }%`;
                    }

                    // Gửi câu trả lời cho người dùng
                    await context.sendActivity(sentimentResponse);
                } catch (err) {
                    console.error('Lỗi khi gọi Text Analytics API: ', err);
                    await context.sendActivity('Đã xảy ra lỗi khi phân tích cảm xúc của bạn.');
                }
            }

            // Đừng quên gọi next() để kết thúc lượt xử lý
            await next();
        });

        // Xử lý khi có thành viên mới tham gia (để gửi tin nhắn chào)
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity('Chào mừng bạn đến với Bot Phân Tích Cảm Xúc! Hãy gõ gì đó để tôi phân tích.');
                }
            }
            await next();
        });
    }
}

module.exports.SentimentBot = SentimentBot;
