const express = require('express');
const cors = require('cors');
require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require("path");

const token = process.env.TOKEN
const appUrl = process.env.APPURL

const bot = new TelegramBot(token, {polling: true});

const app = express();

app.use(express.json());
app.use(cors());

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Нажми кнопку "За покупками"', {
            reply_markup: {
                keyboard: [
                    [{text: 'За покупками!', web_app: {url: appUrl + '/products'}}],
                ],
                resize_keyboard: true
            }
        });

        await bot.sendMessage(chatId, 'Нажми кнопку "Зарегистрироваться"', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Зарегистрироваться', web_app: {url: appUrl + '/form'}}],
                ],
            }
        });
    }

    if(msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data)
            console.log(data)
            await bot.sendMessage(chatId, 'Спасибо за обратную связь!')
            await bot.sendMessage(chatId, 'Ваш город: ' + data?.city);
            await bot.sendMessage(chatId, 'Ваш адрес доставки: ' + data?.address);

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю информацию вы получите в этом чате');
            }, 3000)
        } catch (e) {
            console.log(e);
        }
    }
});

app.post('/web-data', async (req, res) => {
    const {queryId, products = [], totalPrice} = req.body;
    console.log(products, 'PRODUCTS')

    try {
        // await bot.answerWebAppQuery(queryId, {
        //     type: 'article',
        //     id: queryId,
        //     title: 'Успешная покупка',
        //     input_message_content: {
        //         message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
        //     }
        // })
        return res.status(200).json(products);
    } catch (e) {
        // await bot.answerWebAppQuery(queryId, {
        //     type: 'article',
        //     id: queryId,
        //     title: 'Не удалось приобрести товар',
        //     input_message_content: {
        //         message_text: 'Не удалось приобрести товар'
        //     }
        // })
        return res.status(500).json({})
    }
})

const PORT = 8843;
const HTTP_PORT = 8000;

const options = {
    key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
}

const httpsServer = https.createServer(options, app)
const httpServer = http.createServer(app)

httpsServer.listen(PORT, () => {
    console.log(`HTTPS server is running on ${PORT} port`)
})

httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP server is running on ${HTTP_PORT} port`)
})
