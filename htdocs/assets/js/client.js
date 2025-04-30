/**
 * Datei: client.js
 * Socket.IO-Verbindung herstellen
 */

//var socket = io.connect('https://www.host-x.de:3000');
const socket = io({ path: '/socket.io' });

$(function () {
    /**
     *
     * Fade out all for non logged in users (anonymous)
     *
     */
    if (window.localStorage.getItem('chatusr') === null) {
        /**
         *
         */
        $('#bwChatSystemClient').fadeOut();
        $('#OperatorContainer').fadeOut();
        $('.chat-messages-container').fadeOut();
        $('#logincontainerUsr').fadeIn();
    } else {
        /**
         * Wenn Benutzer bereits eingeloggt ist, sende Nutzernamen und Kanal an den Server
         */
        let chatusr = window.localStorage.getItem('chatusr');
        let kanal = window.localStorage.getItem('kanal');
        let role = window.localStorage.getItem('role') || 'user'; // Standardmäßig 'user' wenn nicht angegeben

        socket.emit('send-user-and-kanal-name', {
            username: chatusr,
            kanal: kanal,
            role: role,
        });
    }

    // Typing-Indicator wird dynamisch eingefügt und entfernt, wenn notwendig

    $('#logincontainerUsr').submit(function (e) {
        e.preventDefault();
        /**
         *
         */
        let chatusr = $('#chatusr').val();
        let kanal = $('#kanal').val();
        let role = $('#role').val() || 'user';
        /**
         *
         */
        window.localStorage.setItem('chatusr', chatusr);
        window.localStorage.setItem('kanal', kanal);
        window.localStorage.setItem('role', role);
        /**
         *
         */
        $('#logincontainerUsr').fadeOut();
        $('#OperatorContainer').fadeIn();
        $('#bwChatSystemClient').fadeIn();
        $('.chat-messages-container').fadeIn();
        /**
         *
         */
        location.reload(); // reload page
        document.getElementById('msg').focus();
    });

    /**
     *
     * User is joining a kanal
     *
     */
    socket.on('userJoin', function (msg) {
        if (window.localStorage.getItem('chatusr') !== null && window.localStorage.getItem('kanal') !== null) {
            let role = window.localStorage.getItem('role') || 'user';
            socket.emit('send-user-and-kanal-name', {
                username: window.localStorage.getItem('chatusr'),
                kanal: window.localStorage.getItem('kanal'),
                role: role,
            }); // send username, kanal and role to server
        }
    });

    /**
     * Auf 'kanalUsers'-Meldung reagieren und die Operator ID ermitteln
     */
    socket.on('kanalUsers', ({ kanal, users, operators }) => {
        console.log('Kanal und Benutzer empfangen:', kanal, users, operators);

        // Finde den Operator in der Benutzerliste
        const operator = operators.length > 0 ? operators[0] : null;

        if (operator) {
            console.log('Operator gefunden:', operator.username, operator.id);
            $('#ReceiversSocketId').val(operator.id);
        } else {
            console.log('Kein Operator gefunden');
        }
    });

    /**
     *
     * Show message from server
     *
     */
    socket.on('message', (message) => {
        outputMessage(message);
        //Play Sound
        var obj = document.createElement('audio');
        obj.src = './assets/audio/beep.mp3';
        obj.play();
        /**
         * Scroll to bottom
         */
        const chatContainer = document.querySelector('.chat-messages-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        const chatContainerOperator = document.querySelector('.chat-messages-operator-container');
        if (chatContainerOperator) {
            chatContainerOperator.scrollTop = chatContainerOperator.scrollHeight;
        }
    });

    /**
     * Typing indicator - Zeige Schreibindikator, wenn der Operator tippt
     */
    socket.on('typing', function (data) {
        if (data.username === 'Nick' || data.role === 'operator') {
            // Entferne vorhandenen Indikator, falls vorhanden
            $('#typing-indicator').remove();

            // Füge den Indikator am Ende des Chat-Containers ein
            $('.chat-messages-container').append('<div class="typing-indicator" id="typing-indicator"><span></span><span></span><span></span></div>');

            // Scroll to bottom
            const chatContainer = document.querySelector('.chat-messages-container');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }
    });

    /**
     * Typing indicator - Verstecke Schreibindikator, wenn der Operator aufhört zu tippen
     */
    socket.on('stopTyping', function (data) {
        if (data.username === 'Nick' || data.role === 'operator') {
            $('#typing-indicator').fadeOut(function () {
                $(this).remove();
            });
        }
    });

    // Tracking-Variable für den Tippstatus
    let isTyping = false;
    let typingTimeout;

    // Erfasse Tastatureingaben im Eingabefeld
    $('#msg').on('input', function () {
        if (!isTyping) {
            isTyping = true;
            // Sende Typing-Event an den Server (für Operator)
            let ReceiversSocketId = $('#ReceiversSocketId').val();
            if (ReceiversSocketId !== '') {
                socket.emit('typing', {
                    username: window.localStorage.getItem('chatusr'),
                    role: window.localStorage.getItem('role') || 'user',
                    receiverSocketId: ReceiversSocketId,
                });
            }
        }

        // Setze bestehenden Timeout zurück
        clearTimeout(typingTimeout);

        // Setze Timeout, um Typing-Status nach kurzer Inaktivität zurückzusetzen
        typingTimeout = setTimeout(function () {
            isTyping = false;
            let ReceiversSocketId = $('#ReceiversSocketId').val();
            if (ReceiversSocketId !== '') {
                socket.emit('stopTyping', {
                    username: window.localStorage.getItem('chatusr'),
                    role: window.localStorage.getItem('role') || 'user',
                    receiverSocketId: ReceiversSocketId,
                });
            }
        }, 1000);
    });

    /**
     *
     * Send a new message (Clients and Operators use this function)
     * Todo: Should be devided into two functions in two separate files
     *
     */
    $('#bwChatSystemClient').on('keydown', function (e) {
        /**
         *
         *
         */
        if (e.key === 'Enter') {
            e.preventDefault();
            /**
             * Vars
             */
            let ReceiversSocketId = $('#ReceiversSocketId').val();
            let path = window.location.pathname;
            let page = path.split('/').pop();

            if ($('#msg').val() == '') {
                return;
            }

            // Debugging für Socket ID
            console.log('Sende Nachricht an Operator mit Socket ID:', ReceiversSocketId);

            // Bei Nachrichtenversand Typing-Status sofort beenden
            isTyping = false;
            clearTimeout(typingTimeout);
            socket.emit('stopTyping', {
                username: window.localStorage.getItem('chatusr'),
                role: window.localStorage.getItem('role') || 'user',
                receiverSocketId: ReceiversSocketId,
            });

            // Emittiere/Sende Message
            socket.emit('ChatMessageOneToOne', {
                msg: $('#msg').val(),
                ReceiversSocketId: ReceiversSocketId,
                role: window.localStorage.getItem('role') || 'user',
            });
            $('#msg').val('');
            $('#msg').attr('placeholder', '');
        }
    });
});

/**
 *
 * FUNKTIONEN
 *
 */

/**
 *
 * Output message to DOM
 *
 */
function outputMessage(message) {
    /**
     *
     *
     */
    let class_message = '';
    if (message.username == 'ChatBot') {
        class_message = 'operator avatarChatClient';
    } else if (message.username == 'Nick' || message.role == 'operator') {
        class_message = 'operator avatarOperator';
    } else {
        class_message = 'avatarClient';
    }
    /**
     *
     */
    $('.chat-messages-container').append(
        $('<div class="bubble ' + class_message + '"><p class="meta">' + message.username + '<span> ' + message.time + '</span></p><p class="text">' + message.text + '</p></div>')
            .hide()
            .fadeIn()
    );
}
