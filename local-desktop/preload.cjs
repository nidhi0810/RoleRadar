const { contextBridge, ipcRenderer } = require("electron");

console.log("PRELOAD LOADED");

contextBridge.exposeInMainWorld("electronAPI", {

    rendererReady: () => {
        ipcRenderer.send("renderer-ready");
    },

    onQRCode: (callback) => {
        ipcRenderer.on("whatsapp-qr", (event, qr) => {
            console.log("QR RECEIVED IN PRELOAD");
            callback(qr);
        });
    },

    onWhatsAppConnected: (callback) => {
        ipcRenderer.on("whatsapp-connected", () => {
            console.log("WHATSAPP CONNECTED IN PRELOAD");
            callback();
        });
    },

    onWhatsAppChannels: (callback) => {
        ipcRenderer.on("whatsapp-channels", (event, channels) => {
            console.log("CHANNELS RECEIVED IN PRELOAD");
            callback(channels);
        });
    },

    saveSelectedChannels: (channels) => {
        ipcRenderer.send("save-selected-channels", channels);
    },
    
    login: (email, password) => {
        ipcRenderer.send("login", { email, password });
    },

    onLoginSuccess: (callback) => {
        ipcRenderer.on("login-success", (event, user) => {
            callback(user);
        });
    },

    onLoginError: (callback) => {
        ipcRenderer.on("login-error", (event, message) => {
            callback(message);
        });
    },

    checkAuth: () => {
        ipcRenderer.send("check-auth");
    },

    onAuthStatus: (callback) => {
        ipcRenderer.on(
            "auth-status",
            (event, isAuthenticated) => {
                callback(isAuthenticated);
            }
        );
    }
});