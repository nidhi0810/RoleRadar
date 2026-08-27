import {
    app,
    BrowserWindow,
    ipcMain,
    safeStorage
} from "electron";

import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

import connectWhatsApp, {
    setMessageSender,
    setSelectedChannels
} from "./whatsapp/whatsapp.js";


const preloadPath = fileURLToPath(
    new URL("./preload.cjs", import.meta.url)
);

let authToken = null;
// --------------------------------------------------
// APP STATE
// --------------------------------------------------

function getStatePath() {

    return path.join(
        app.getPath("userData"),
        "state.json"
    );
}

function saveAuthToken(token) {

    if (!safeStorage.isEncryptionAvailable()) {

        throw new Error(
            "Secure storage is not available"
        );
    }

    const encryptedToken =
        safeStorage.encryptString(token);

    appState.authToken =
        encryptedToken.toString("base64");

    saveState(appState);
}


function loadAuthToken() {

    if (!appState.authToken) {
        return null;
    }

    if (!safeStorage.isEncryptionAvailable()) {

        console.error(
            "Secure storage is not available"
        );

        return null;
    }

    try {

        const encryptedToken =
            Buffer.from(
                appState.authToken,
                "base64"
            );

        return safeStorage.decryptString(
            encryptedToken
        );

    } catch (error) {

        console.error(
            "FAILED TO DECRYPT AUTH TOKEN:",
            error
        );

        return null;
    }
}

function loadState() {

    const statePath = getStatePath();

    if (!fs.existsSync(statePath)) {

        return {
            selectedChannels: []
        };
    }

    try {

        return JSON.parse(
            fs.readFileSync(
                statePath,
                "utf-8"
            )
        );

    } catch (error) {

        console.error(
            "FAILED TO LOAD STATE:",
            error
        );

        return {
            selectedChannels: []
        };
    }
}


function saveState(state) {

    const statePath = getStatePath();

    fs.writeFileSync(
        statePath,
        JSON.stringify(
            state,
            null,
            4
        ),
        "utf-8"
    );
}


// Load state once when the app starts.

const appState = loadState();

console.log(
    "LOADED APP STATE:",
    {
        selectedChannels: appState.selectedChannels,
        hasAuthToken: !!appState.authToken
    }
);


// --------------------------------------------------
// GLOBAL VARIABLES
// --------------------------------------------------

let latestQR = null;

let rendererReady = false;


let win = null;


// --------------------------------------------------
// SEND SELECTED WHATSAPP MESSAGE TO BACKEND
// --------------------------------------------------

async function sendMessageToBackend(jobMessage) {

    if (!authToken) {

        console.log(
            "NO AUTH TOKEN - MESSAGE NOT SENT"
        );

        return;
    }

    try {

        const response = await fetch(
            "http://localhost:5000/api/v1/messages",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },

                body: JSON.stringify(jobMessage)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            console.error(
                "BACKEND MESSAGE ERROR:",
                data
            );

            return;
        }


        console.log(
            "MESSAGE SENT TO BACKEND:"
        );

        console.log(data);

    } catch (error) {

        console.error(
            "FAILED TO SEND MESSAGE TO BACKEND:",
            error
        );
    }
}


// --------------------------------------------------
// RENDERER READY
// --------------------------------------------------

ipcMain.on(
    "renderer-ready",
    (event) => {

        console.log(
            "RENDERER READY"
        );

        rendererReady = true;


        if (latestQR) {

            console.log(
                "SENDING STORED QR TO RENDERER"
            );

            event.sender.send(
                "whatsapp-qr",
                latestQR
            );
        }
    }
);


// --------------------------------------------------
// SELECTED CHANNELS
// --------------------------------------------------

ipcMain.on(
    "save-selected-channels",
    (event, channels) => {

        console.log(
            "SELECTED CHANNELS RECEIVED IN MAIN:"
        );

        console.log(channels);


        // Update WhatsApp module.

        setSelectedChannels(
            channels
        );


        // Update local state.

        appState.selectedChannels =
            channels;


        // Persist state.

        saveState(
            appState
        );


        console.log(
            "SELECTED CHANNELS SAVED:"
        );

        console.log(
            appState.selectedChannels
        );
    }
);


// --------------------------------------------------
// LOGIN
// --------------------------------------------------

ipcMain.on(
    "login",
    async (event, credentials) => {

        try {

            console.log(
                "LOGIN REQUEST RECEIVED"
            );


            const response = await fetch(
                "http://localhost:5000/api/v1/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email:
                            credentials.email,

                        password:
                            credentials.password
                    })
                }
            );


            const data =
                await response.json();


            // -----------------------------
            // LOGIN FAILED
            // -----------------------------

            if (!response.ok) {

                event.sender.send(
                    "login-error",
                    data.message ||
                        "Login failed"
                );

                return;
            }


            // -----------------------------
            // LOGIN SUCCESS
            // -----------------------------


                authToken = data.token;

            saveAuthToken(authToken);

            console.log(
                "AUTH TOKEN SAVED SECURELY"
            );

            console.log(
                "LOGIN SUCCESS"
            );

            console.log(
                "USER:",
                data.user
            );


            // Give WhatsApp module access
            // to the backend sender.

            setMessageSender(
                sendMessageToBackend
            );


            // Tell renderer login succeeded.

            event.sender.send(
                "login-success",
                data.user
            );


            // -----------------------------
            // START WHATSAPP
            // -----------------------------

            console.log(
                "STARTING WHATSAPP..."
            );


            await connectWhatsApp(
                win,
                (qr) => {

                    latestQR = qr;


                    console.log(
                        "QR STORED"
                    );


                    if (rendererReady) {

                        console.log(
                            "RENDERER ALREADY READY - SENDING QR"
                        );


                        win.webContents.send(
                            "whatsapp-qr",
                            qr
                        );
                    }
                }
            );

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            event.sender.send(
                "login-error",
                "Unable to connect to server"
            );
        }
    }
);


ipcMain.on("check-auth", (event) => {

    if (authToken) {

        event.sender.send(
            "auth-status",
            true
        );

    } else {

        event.sender.send(
            "auth-status",
            false
        );
    }
});

// --------------------------------------------------
// CREATE ELECTRON WINDOW
// --------------------------------------------------
async function startWhatsApp() {

    console.log(
        "STARTING WHATSAPP..."
    );

    await connectWhatsApp(
        win,
        (qr) => {

            latestQR = qr;

            console.log(
                "QR STORED"
            );

            if (rendererReady) {

                win.webContents.send(
                    "whatsapp-qr",
                    qr
                );
            }
        }
    );
}

async function createWindow() {

    const window =
        new BrowserWindow({

            width: 1000,

            height: 700,

            webPreferences: {

                preload:
                    preloadPath,

                contextIsolation:
                    true,

                nodeIntegration:
                    false
            }
        });


    await window.loadFile(
        "./renderer/index.html"
    );


    return window;
}
function isTokenExpired(token) {

    try {

        const payload = JSON.parse(
            Buffer.from(
                token.split(".")[1],
                "base64"
            ).toString("utf-8")
        );

        if (!payload.exp) {
            return true;
        }

        return Date.now() >= payload.exp * 1000;

    } catch (error) {

        console.error(
            "INVALID JWT:",
            error
        );

        return true;
    }
}

// --------------------------------------------------
// ELECTRON READY
// --------------------------------------------------

app.whenReady().then(
    async () => {

                
        authToken = loadAuthToken();

        if (authToken && !isTokenExpired(authToken)) {

            console.log(
                "AUTH TOKEN RESTORED"
            );

        } else {

            console.log(
                "NO VALID AUTH TOKEN"
            );

            authToken = null;

            appState.authToken = null;

            saveState(appState);
        }


        win =
            await createWindow();


        console.log(
            "WINDOW CREATED:",
            !!win
        );

        if (authToken) {

            console.log(
                "STORED AUTH FOUND - STARTING WHATSAPP AUTOMATICALLY"
            );

            setMessageSender(
                sendMessageToBackend
            );

            await startWhatsApp();
        }
        // --------------------------------------------------
        // RESTORE SELECTED CHANNELS
        // --------------------------------------------------

        setSelectedChannels(
            appState.selectedChannels
        );


        console.log(
            "RESTORED SELECTED CHANNELS:",
            appState.selectedChannels
        );
    }
);