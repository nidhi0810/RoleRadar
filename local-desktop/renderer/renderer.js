console.log("RENDERER LOADED");

const status = document.getElementById("status");
const qrContainer = document.getElementById("qr-container");
const channelsSection = document.getElementById("channels-section");
const channelsContainer = document.getElementById("channels-container");
const saveChannelsButton = document.getElementById("save-channels");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const loginStatus = document.getElementById("login-status");

const loginSection = document.getElementById("login-section");
const whatsappSection = document.getElementById("whatsapp-section");

window.electronAPI.onQRCode((qr) => {

    console.log("QR RECEIVED IN RENDERER");

    status.textContent = "Scan this QR code with WhatsApp";

    qrContainer.innerHTML = "";

    const img = document.createElement("img");

    img.src = qr;

    img.style.width = "300px";
    img.style.height = "300px";

    qrContainer.appendChild(img);
});

window.electronAPI.onWhatsAppConnected(() => {

    console.log("WHATSAPP CONNECTED IN RENDERER");

    status.textContent = "WhatsApp Connected";

    qrContainer.innerHTML = "";

    channelsSection.style.display = "block";
});

window.electronAPI.onWhatsAppChannels((channels) => {

    console.log("CHANNELS RECEIVED IN RENDERER");

    channelsContainer.innerHTML = "";

    channels.forEach((channel) => {

        const label = document.createElement("label");

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.value = channel.id;

        label.appendChild(checkbox);
        label.appendChild(
            document.createTextNode(" " + channel.name)
        );

        channelsContainer.appendChild(label);
        channelsContainer.appendChild(
            document.createElement("br")
        );
    });
});

saveChannelsButton.addEventListener("click", () => {

    const selectedChannels = [];

    const checkboxes =
        channelsContainer.querySelectorAll(
            'input[type="checkbox"]:checked'
        );

    checkboxes.forEach((checkbox) => {
        selectedChannels.push(checkbox.value);
    });

    console.log("SELECTED CHANNELS:", selectedChannels);

    window.electronAPI.saveSelectedChannels(selectedChannels);
});

loginButton.addEventListener("click", () => {

    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        loginStatus.textContent = "Email and password are required";
        return;
    }

    loginStatus.textContent = "Logging in...";

    window.electronAPI.login(email, password);
});

window.electronAPI.onLoginSuccess((user) => {

    console.log("LOGIN SUCCESS:", user);

    loginSection.style.display = "none";
    whatsappSection.style.display = "block";

    status.textContent = `Welcome, ${user.name}`;
});

window.electronAPI.onLoginError((message) => {

    console.log("LOGIN FAILED:", message);

    loginStatus.textContent = message;
});

window.electronAPI.onAuthStatus(
    (isAuthenticated) => {

        if (isAuthenticated) {

            console.log(
                "AUTHENTICATED FROM STORED TOKEN"
            );

            document.getElementById(
                "login-section"
            ).style.display = "none";

        } else {

            console.log(
                "NO STORED AUTH"
            );

            document.getElementById(
                "login-section"
            ).style.display = "block";
        }
    }
);

window.electronAPI.checkAuth();
window.electronAPI.rendererReady();