function getDeviceFingerprint() {
    // 1. اجمع كل البيانات الممكنة عن الجهاز
    let components = {
        userAgent: navigator.userAgent,        // نظام التشغيل والمتصفح
        language: navigator.language,          // لغة الجهاز
        platform: navigator.platform,          // نوع الجهاز (Win/Mac/Linux)
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // التوقيت
        screenWidth: screen.width,             // عرض الشاشة
        screenHeight: screen.height,           // ارتفاع الشاشة
        colorDepth: screen.colorDepth,         // عمق الألوان
        touchSupport: 'ontouchstart' in window, // شاشة لمس ولا لأ؟
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown', // عدد الأنوية
        deviceMemory: navigator.deviceMemory || 'unknown' // الرام (مش مدعوم في كل المتصفحات)
    };

    // 2. حول الكائن ده لكلمة (String) عشان نقدر نعملها هاش
    let fingerprintString = JSON.stringify(components);

    // 3. اعمل هاش (Hash) بسيط عشان تختصر البيانات الطويلة دي في رقم
    // دي دالة بسيطة لعمل هاش، مش بتحتاج مكتبات
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // حوله لـ 32-bit integer
        }
        return Math.abs(hash).toString(16); // حوله لـ Hex عشان يبقى شكل رقم
    }

    // 4. ارجع الرقم النهائي
    return simpleHash(fingerprintString);
}

function get_quest(quest) { // ==> [ [color1, shape1], [color2, shape2] ]
    let colors = {
        "red": "rgb(253,93,87)",
        "green": "rgb(50,182,69)",
        "blue": "rgb(1,166,204)",
        "yellow": "rgb(255, 203, 50)",
        "white": "rgb(253,253,253)"
    }

    let shapes = {
        "sofa": "كرسي",
        "glass": "زجاجة",
        "book": "كتاب",
        "cat": "قط",
        "ice_man": "رجل ثلج"
    }

    let color1 = colors[quest[0][0]];
    let color2 = colors[quest[1][0]];
    let img1 = shapes[quest[0][1]];
    let img2 = shapes[quest[1][1]];
    
    let img1_ = document.querySelector(".plate .img:nth-child(1)");
    let img2_ = document.querySelector(".plate .img:nth-child(2)");

    img1_.style.transition = "none";
    img2_.style.transition = "none";

    img1_.style.transform = "translateX(-100%)";
    img2_.style.transform = "translateX(100%)";

    load_img(`./أيقونات/${img1}.svg`, img1_, color1);
    load_img(`./أيقونات/${img2}.svg`, img2_, color2);

    img1_.style.transition = "transform 0.3s";
    img2_.style.transition = "transform 0.3s";

    setTimeout(() => {
        img1_.style.transform = `translateX(0) rotate(${Math.random() * 360}deg)`;
        img2_.style.transform = `translateX(0) rotate(${Math.random() * 360}deg)`;
    }, 100);
}

function load_img(path, container, color = "") {
    fetch(path)
      .then(response => response.text())
      .then(svg => {
        container.innerHTML = svg;
        const icon = container.querySelector("svg");
        if(color != "") {
            icon.style.setProperty("--c1", color);
        }

        icon.style.width = "100%";
        icon.style.height = "auto"; // للحفاظ على النسبة
      });
}

function message(text, type = "s", delay = 1500) { // type = s | w | e => success | warning | error
    let msg = document.querySelector(".msg");
    msg.innerText = text;
    msg.style.top = "20px";
    if(type == "s") msg.style.backgroundColor = "#00c700";
    else if(type == "w") msg.style.backgroundColor = "#d3b000";
    else if(type == "e") msg.style.backgroundColor = "#c10000";

    setTimeout(() => {
        msg.style.top = "-100%";
    }, delay);
}

function open_page(text) {
    document.querySelectorAll(`.page:not(.${text}-page)`).forEach((e) => {
        e.style.display = "none";
    });

    document.querySelector(`.${text}-page`).style.display = "";
}

function load_score(scores) {
    document.querySelector(".n2").innerText = scores[playerId];
    document.querySelector(".n1").innerText = scores[Object.keys(scores).find(id => id !== playerId)];
}

let link = "//fedora.taild60dae.ts.net";
const ws = new WebSocket("wss:" + link);
let deviceId = getDeviceFingerprint();
let playerId = null;
let activeRoom = 0;
let last_answer = "";

ws.onopen = () => {
    console.log('متصل بالسيرفر');

    ws.send(JSON.stringify({
        type: "init",
        device_id: deviceId
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('استلمت:', data);
    
    if (data.type === 'init') {
        playerId = data.playerId;
        console.log('معرفك:', playerId, deviceId);
    }

    if(data.type == "response new_room") {
        message(`تم إنشاء الغرفة ${data.id} بنجاح`, "s");
        activeRoom = data.id;
        open_page("play");
    } else if(data.type == "error new_room") {
        message(`الغرفة ${data.id} محجوزة`, "e");
    }

    else if(data.type == "response join_room") {
        message(`تم دخولك إلى غرفة ${data.id} بنجاح`, "s");
        activeRoom = data.id;
        if("scores" in data) load_score(data.scores);
        open_page("play");
    } else if(data.type == "error join_room") {
        if(data.msg == "Room is full") message(`الغرفة ${data.id} مكتملة`, "w");
        else if(data.msg == "Room not found") message(`الغرفة ${data.id} غير موجودة`, "w");
    }

    else if(data.type == "quest") {
        get_quest(data.items);

        document.querySelectorAll(".buttons .btn").forEach((e) => {
            e.classList.remove("true");
            e.classList.remove("false");
            e.classList.remove("no-click");
        });
    }

    else if(data.type == "response submit_answer") {
        load_score(data.scores);

        if(data.msg.answer_status) {
            document.querySelectorAll(".buttons .btn").forEach((e) => {
                e.classList.add("no-click");
            });
        }

        if(data.msg.player_id == playerId) {
            if(data.msg.answer_status == true) {
                document.querySelector(last_answer).classList.add("true");
            } else {
                document.querySelector(last_answer).classList.add("false");
            }
        }
    }
};

/*
استلمت: 
Object { type: "response submit_answer", msg: {…}, scores: {…} }
​
msg: Object { player_id: "a95a0ebb", player_answer: (2) […], answer_status: true }
​
scores: Object { a95a0ebb: 1, 07d2bce9: 0 }
​
​
07d2bce9: 0
​
​
a95a0ebb: 1
*/

// إرسال رسالة
function send(data) {
    ws.send(JSON.stringify({player_id: playerId, ... data}));
}

function sendMessage(msg) {
    ws.send(JSON.stringify({
        type: 'chat',
        message: msg
    }));
}

let homePage = document.querySelector(".home-page");
let playPage = document.querySelector(".play-page");

let form = homePage.querySelector("form");
let roomNum = homePage.querySelector(".room-num");
let newRoomBtn = homePage.querySelector(".new-room");
let joinRoomBtn = homePage.querySelector(".join-room");

form.addEventListener("submit", function(e) {
    e.preventDefault();
});

newRoomBtn.onclick = () => {
    if(roomNum.value.trim() == "") message("أدخل رقم صحيح", "w", 1000);
    else {
        send({
            type: "new_room",
            id: roomNum.value
        });
    }
}

joinRoomBtn.onclick = () => {
    if(roomNum.value.trim() == "") message("أدخل رقم صحيح", "w", 1000);
    else {
        send({
            type: "join_room",
            id: roomNum.value
        });
    }
}

playPage.querySelector(".buttons").onclick = (eo) => {
    let button = eo.target.closest(".btn");
    if(button) {
        let items = [...button.classList].join(" ").replace("btn ", "").replace("-", "_").split(" ");
        last_answer = `.${items.join(".").replace("_", "-")}`;
        button.classList.add("no-click");
        console.log(items);

        send({
            type: "submit_answer",
            id: activeRoom,
            answer: items
        });
    }
}
// get_quest("كرسي", "زجاجة", "#fff", "red");