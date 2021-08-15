$(function () {
    var socket = io();

    /**
     *
     * User joined a room
     *
     */
    socket.on("userJoin", function (msg) {
        if (window.sessionStorage.getItem("usr") !== null && window.sessionStorage.getItem("room") !== null) {
            socket.emit("send-user-and-room-name", { username: window.sessionStorage.getItem("usr"), room: window.sessionStorage.getItem("room") }); // send username and room to server
        }
    });

    /**
     *
     * get users (for operators)
     *
     */
    socket.on("roomUsers", ({ room, users }) => {
        outputRoomName(room);
        outputUsers(users);
    });

    /**
     *
     * Show message from server
     *
     */
    socket.on("message", (message) => {
        outputMessage(message);

        //Play Sound
        var obj = document.createElement("audio");
        obj.src = "./assets/audio/beep.mp3";
        obj.play();

        // Scroll down
        document.querySelector(".chat-messages").scrollTop = document.querySelector(".chat-messages").scrollHeight;
    });

    /**
     *
     * Send a new message
     *
     */
    $("#chat").on("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            var ReceiversSocketId = $("#ReceiversSocketId").val();
            var path = window.location.pathname;
            var page = path.split("/").pop();

            if (page == "chat.html") {
                ReceiversSocketId = "";
            }

            if (ReceiversSocketId == "" && page == "operator.html") {
                alert("Please choose a user");
                return;
            }

            if ($("#m").val() == "") {
                if (page == "operator.html") {
                    alert("Message can not be empty");
                }
                return;
            }
            // Emit Message
            //socket.emit("chatMessage", $("#m").val());
            socket.emit("ChatMessageOneToOne", { msg: $("#m").val(), ReceiversSocketId: ReceiversSocketId });

            $("#m").val("");
            $("#m").attr("placeholder", "");
        }
    });

    /**
     *
     * Fade out all for non logged in users (anonymous)
     *
     */
    if (window.sessionStorage.getItem("usr") === null) {
        $("#chat").fadeOut();
        $("#OperatorContainer").fadeOut(); // Opeatorpage only
        $(".chat-messages").fadeOut();
        $("#loginmaske").fadeIn();
    }

    $("#loginmaske").submit(function (e) {
        e.preventDefault();
        var usr = $("#usr").val();
        var room = $("#room").val();
        //var room = $("#usr").val();
        window.sessionStorage.setItem("usr", usr);
        window.sessionStorage.setItem("room", room);
        $("#loginmaske").fadeOut();
        $("#OperatorContainer").fadeIn(); // Operatorpage only
        $("#chat").fadeIn();
        $(".chat-messages").fadeIn();
        location.reload(); // reload page
        document.getElementById("m").focus();
    });
});

/**
 *
 * FUNKTIONEN
 *
 */
// Add room name to DOM
function outputRoomName(room) {
    document.getElementById("room-name").innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    $("#users").html("");
    users.forEach((user) => {
        if (user.username != "Nick") {
            $("#users").append(
                $('<li id="' + user.id + '" style="cursor:pointer" title="' + user.id + '">')
                    .text(user.username)
                    .hide()
                    .fadeIn()
            );
        }
    });
}

// Output message to DOM
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");

function outputMessage(message) {
    if (message.username == "ChatBot") {
        var class_message = "operator usrbild_chatbot";
    } else if (message.username == "Nick") {
        var class_message = "operator usrbild_operator";
    } else {
        var class_message = "";
    }
    /*     const div = document.createElement("div");
    div.classList.add(class_message);
    const p = document.createElement("p");
    p.classList.add("meta");
    p.innerText = message.username;
    p.innerHTML += `<span>${message.time}</span>`;
    div.appendChild(p);
    const para = document.createElement("p");
    para.classList.add("text");
    para.innerText = message.text;
    div.appendChild(para);
    document.querySelector(".chat-messages").appendChild(div); */
    //$("#ReceiversSocketId").val(message.from);

    $(".chat-messages").append(
        $('<div class="message ' + class_message + '"><p class="meta">' + message.username + "<span> " + message.time + '</span></p><p class="text">' + message.text + "</p></div>")
            .hide()
            .fadeIn()
    );
}
