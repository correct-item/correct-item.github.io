function get_quest(img1, img2, color1 = "", color2 = "") {
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
      });
}

get_quest("كرسي", "زجاجة", "#fff", "red");

const ws = new WebSocket("wss://trueitembackend.velixir.run/ws");

ws.onopen = () => {
    console.log("OPEN");
};

ws.onmessage = e => {
    console.log("MESSAGE:", e.data);
};

ws.onerror = e => {
    console.log("ERROR:", e);
};

ws.onclose = e => {
    console.log("CLOSE:", e.code, e.reason, e.wasClean);
};