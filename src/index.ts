import { Address, beginCell, toNano } from "@ton/core";
import { TonClient } from "@ton/ton";
import { configDotenv } from "dotenv";
import qs from "qs";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters"

configDotenv();
 
const bot = new Telegraf(process.env.TG_BOT_TOKEN!) 
const toncenter = new TonClient({
    endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
})

const increment = 'Increment by 3'
const deposit = 'Deposit 1 TON'
const withdrawal = 'Withdraw 0.1 TON'

bot.start(ctx => {
    ctx.reply('Welcome to FunC Web App bot!', {
        reply_markup: {
            keyboard: [
                [increment],
                [deposit],
                [withdrawal]
            ]
        }
    })
})
 
bot.hears(increment, ctx => {
    const msgBody = beginCell()
        .storeUint(1, 32)
        .storeUint(3, 32)
        .endCell()

    let link = 
        `ton://transfer/${process.env.SC_ADDRESS}?${qs.stringify({
            text: "Increment transaction",
            amount: toNano("0.05"),
            bin: msgBody.toBoc({idx: false}).toString("base64")
        })}`
    ctx.reply('To increment, please sign the transaction:', {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Sign transaction',
                    url: link
                }]
            ]
        }
    })
})

bot.hears(deposit, ctx => {
    const msgBody = beginCell()
        .storeUint(2, 32)
        .endCell()

    let link = 
        `ton://transfer/${process.env.SC_ADDRESS}?${qs.stringify({
            text: "Deposit transaction",
            amount: toNano(1),
            bin: msgBody.toBoc({idx: false}).toString("base64")
        })}`
    ctx.reply('To deposit, please sign the transaction:', {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Sign transaction',
                    url: link
                }]
            ]
        }
    })
})

bot.hears(withdrawal, ctx => {
    const msgBody = beginCell()
        .storeUint(3, 32)
        .storeCoins(toNano("0.1"))
        .endCell()

    let link = 
        `ton://transfer/${process.env.SC_ADDRESS}?${qs.stringify({
            text: "Withdrawal transaction",
            amount: toNano("0.01"),
            bin: msgBody.toBoc({idx: false}).toString("base64")
        })}`
    ctx.reply('To withdraw, please sign the transaction:', {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Sign transaction',
                    url: link
                }]
            ]
        }
    })
})

bot.on(message('web_app_data'), ctx => ctx.reply('🥳'))

bot.on(message('sticker'), async ctx => {
    const data = (await toncenter.runMethod(Address.parse(process.env.SC_ADDRESS!), 'get_contract_storage')).stack
    const counter = data.readBigNumber()
    const owner = data.readAddress()
    const recentSender = data.readAddress()

    ctx.reply(`Counter: ${counter}\nOwner: ${owner.toString()}\nRecent sender: ${recentSender.toString()}`)
})

bot.launch();

//Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
