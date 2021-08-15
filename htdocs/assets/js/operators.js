$(function () {
    var socket = io();

    /**
     *
     * Select a single user from left side
     *
     */
    $("#users").on("click", "li", function (e) {
        e.preventDefault();
        var socketid = e.target.id;
        var name = $(this).text();
        $("#ReceiversSocketId").val(socketid);
        $("#m").attr("placeholder", "Deine Nachricht an " + name);
        $("#users li").css("color", "#e15d10");
        $(this).css("color", "green");
    });

    /**
     *
     * Play Sound
     *
     */
    socket.on("userRing", function (msg) {
        var obj = document.createElement("audio");
        obj.src = "./assets/audio/wa_incoming.mp3";
        obj.play();
    });

    /**
     * Setze beim load the page auf ""
     */
    $("#ReceiversSocketId").val("");

    /**
     *
     * Autologin
     *
     */
    if (window.sessionStorage.getItem("usr") != "Nick") {
        $("#login").trigger("click");
    }
});
