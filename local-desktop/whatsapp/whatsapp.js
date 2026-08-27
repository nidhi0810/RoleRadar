import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import QRCode from "qrcode";

import {
    executeWMexQuery
} from "@whiskeysockets/baileys/lib/Socket/mex.js";


let selectedChannels = [];
let channelNameById = {};
let sendMessageToBackend = null;

let getLastSync = null;
let saveLastSync = null;


// --------------------------------------------------
// SELECTED CHANNELS
// --------------------------------------------------

export function setSelectedChannels(channels) {

    selectedChannels = channels;

    console.log(
        "BAILEYS SELECTED CHANNELS:",
        selectedChannels
    );
}

function setChannelDirectory(channels) {
    channelNameById = {};

    for (const channel of channels) {
        channelNameById[channel.id] = channel.name;
    }
}

function getChannelName(chatId) {
    return channelNameById[chatId] || chatId;
}


// --------------------------------------------------
// BACKEND MESSAGE SENDER
// --------------------------------------------------

export function setMessageSender(sender) {

    sendMessageToBackend = sender;
}


// --------------------------------------------------
// SYNC MANAGER
// --------------------------------------------------

export function setSyncManager(
    getSync,
    saveSync
) {

    getLastSync = getSync;

    saveLastSync = saveSync;
}


// --------------------------------------------------
// EXTRACT MESSAGE TEXT
// --------------------------------------------------

function extractMessageText(message) {

    if (!message.message) {
        return null;
    }


    if (message.message.conversation) {

        return message.message.conversation;
    }


    if (
        message.message.extendedTextMessage?.text
    ) {

        return message.message
            .extendedTextMessage
            .text;
    }


    if (
        message.message.imageMessage?.caption
    ) {

        return message.message
            .imageMessage
            .caption;
    }


    if (
        message.message.videoMessage?.caption
    ) {

        return message.message
            .videoMessage
            .caption;
    }


    return null;
}


// --------------------------------------------------
// GET SUBSCRIBED CHANNELS
// --------------------------------------------------

async function getSubscribedChannels(sock) {

    const channels =
        await executeWMexQuery(
            {},
            "6388546374527196",
            "xwa2_newsletter_subscribed",
            sock.query,
            sock.generateMessageTag
        );


    return channels.map(
        (channel) => ({

            id: channel.id,

            name:
                channel.thread_metadata
                    .name.text,

            description:
                channel.thread_metadata
                    .description.text
        })
    );
}


// --------------------------------------------------
// PROCESS MESSAGE
// --------------------------------------------------

async function processMessage(message) {

    const chatId =
        message.key.remoteJid;


    // Ignore messages from
    // channels the user did not select.

    if (
        !selectedChannels.includes(chatId)
    ) {

        return false;
    }


    const text =
        extractMessageText(message);


    if (!text) {

        return false;
    }


    const jobMessage = {

        text: text,

        whatsappMessageId:
            message.key.id,
        channelId: chatId,
        channelName: getChannelName(chatId),
    };


    if (sendMessageToBackend) {

        console.log(
            "SENDING MESSAGE TO BACKEND..."
        );

        await sendMessageToBackend(
            jobMessage
        );
    }


    console.log(
        "----- SELECTED CHANNEL MESSAGE -----"
    );

    console.log(
        "Channel ID:",
        chatId,
        "Channel Name:",
        getChannelName(chatId)
    );

    console.log(
        "Message types:",
        Object.keys(
            message.message || {}
        )
    );

    console.log(
        "Full message:",
        message.message
    );

    console.log(
        "--------------------------------------"
    );


    return true;
}



// --------------------------------------------------
// CONNECT WHATSAPP
// --------------------------------------------------

async function connectWhatsApp(
    win,
    onQR
) {

    console.log(
        "WHATSAPP FUNCTION RECEIVED WINDOW:",
        !!win
    );


    const {
        state,
        saveCreds
    } =
        await useMultiFileAuthState(
            "./auth"
        );


    const sock =
        makeWASocket({

            auth: state,

            logger:
                P({
                    level: "silent"
                }),

        });


    // --------------------------------------------------
    // SAVE BAILEYS CREDENTIALS
    // --------------------------------------------------

    sock.ev.on(
        "creds.update",
        saveCreds
    );



    // --------------------------------------------------
    // LIVE MESSAGES
    // --------------------------------------------------

    sock.ev.on(
        "messages.upsert",
        async (messageUpdate) => {
            for (const message of messageUpdate.messages) {
                try {
                    await processMessage(message);
                } catch (error) {
                    console.error(
                        "Failed to process WhatsApp message:",
                        error.message
                    );
                }
            }
        }
    );
    // --------------------------------------------------
    // CONNECTION
    // --------------------------------------------------

    sock.ev.on(
        "connection.update",
        async (update) => {

            const {
                connection,
                lastDisconnect,
                qr
            } = update;


            // ------------------------------------------
            // QR CODE
            // ------------------------------------------

            if (qr) {

                console.log(
                    "QR GENERATED BY BAILEYS"
                );


                const qrDataURL =
                    await QRCode.toDataURL(
                        qr
                    );


                console.log(
                    "QR CONVERTED TO DATA URL"
                );


                onQR(
                    qrDataURL
                );


                console.log(
                    "QR STORED"
                );
            }


            // ------------------------------------------
            // CONNECTED
            // ------------------------------------------

            if (
                connection === "open"
            ) {

                console.log(
                    "WhatsApp connected!"
                );


                const channelList =
                    await getSubscribedChannels(
                        sock
                    );

                setChannelDirectory(channelList);

                console.log(
                    "Subscribed channels:",
                    channelList
                );


                console.log(
                    "SENDING CONNECTED"
                );


                win.webContents.send(
                    "whatsapp-connected"
                );


                console.log(
                    "SENDING CHANNELS"
                );


                win.webContents.send(
                    "whatsapp-channels",
                    channelList
                );

            }


            // ------------------------------------------
            // CONNECTION CLOSED
            // ------------------------------------------

            if (
                connection === "close"
            ) {

                const shouldReconnect =
                    lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode !==
                    DisconnectReason.loggedOut;


                console.log(
                    "WhatsApp connection closed."
                );


                if (
                    shouldReconnect
                ) {

                    connectWhatsApp(
                        win,
                        onQR
                    );
                }
            }
        }
    );


    return sock;
}


export default connectWhatsApp;